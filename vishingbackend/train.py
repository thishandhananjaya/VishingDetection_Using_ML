import json
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import pandas as pd
import numpy as np
import re
import os
from collections import Counter

# ---------------- DEVICE ----------------
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print("Using device:", device)

# ---------------- DATASET CLASS ----------------
class TextDataset(Dataset):
    def __init__(self, X, y, extra_features=None):
        self.X = torch.tensor(X, dtype=torch.long)
        self.y = torch.tensor(y, dtype=torch.long)
        self.extra = torch.tensor(extra_features, dtype=torch.float) if extra_features is not None else None

    def __len__(self):
        return len(self.X)

    def __getitem__(self, idx):
        if self.extra is not None:
            return self.X[idx], self.extra[idx], self.y[idx]
        else:
            return self.X[idx], self.y[idx]

# ---------------- IMPROVED MODEL ----------------
class ImprovedBiLSTMAttention(nn.Module):
    def __init__(self, vocab_size, embed_dim, hidden_dim, output_dim, num_layers=3, dropout=0.4, extra_features_dim=0):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.lstm = nn.LSTM(
            embed_dim,
            hidden_dim,
            num_layers=num_layers,
            bidirectional=True,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0
        )
        self.attention_fc = nn.Linear(hidden_dim * 2, 1)
        self.batch_norm = nn.BatchNorm1d(hidden_dim * 2)
        self.dropout1 = nn.Dropout(dropout)
        self.dropout2 = nn.Dropout(dropout * 0.5)
        self.extra_features_dim = extra_features_dim

        classifier_input = hidden_dim * 2 + extra_features_dim
        self.fc1 = nn.Linear(classifier_input, hidden_dim)
        self.fc2 = nn.Linear(hidden_dim, hidden_dim // 2)
        self.fc3 = nn.Linear(hidden_dim // 2, output_dim)

        self.relu = nn.ReLU()
        self.layer_norm = nn.LayerNorm(hidden_dim)

    def forward(self, x, extra_features=None):
        embedded = self.embedding(x)
        embedded = self.dropout1(embedded)
        lstm_out, _ = self.lstm(embedded)
        attn_weights = torch.softmax(self.attention_fc(lstm_out), dim=1)
        context = torch.sum(attn_weights * lstm_out, dim=1)
        context = self.batch_norm(context)
        context = self.dropout1(context)

        if extra_features is not None:
            context = torch.cat([context, extra_features], dim=1)

        x = self.relu(self.fc1(context))
        x = self.layer_norm(x)
        x = self.dropout2(x)
        x = self.relu(self.fc2(x))
        x = self.dropout2(x)
        output = self.fc3(x)
        return output

# ---------------- IMPROVED SCAM DETECTOR ----------------
class ImprovedScamDetector:
    def __init__(self, json_path, max_words=3000, max_len=150, embed_dim=200, hidden_dim=256):
        self.json_path = json_path
        self.max_words = max_words
        self.max_len = max_len
        self.embed_dim = embed_dim
        self.hidden_dim = hidden_dim
        self.scam_keywords = []

    # ---------- LOAD DATA ----------
    def load_data(self):
        if not os.path.exists(self.json_path):
            raise FileNotFoundError(f"Dataset file not found: {self.json_path}")
        with open(self.json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        if not data:
            raise ValueError("JSON dataset is empty!")
        df = pd.DataFrame(data)
        df = df.drop_duplicates(subset=['text'])
        print(f"Loaded {len(df)} samples")
        print(f"Label distribution:\n{df['label'].value_counts()}")
        return df

    # ---------- BALANCE DATA ----------
    def balance_data(self, df):
        label_counts = df['label'].value_counts()
        print(f"\nOriginal distribution:\n{label_counts}")
        max_count = label_counts.max()
        balanced_dfs = []
        for label in df['label'].unique():
            label_df = df[df['label'] == label]
            if len(label_df) < max_count:
                label_df = label_df.sample(n=max_count, replace=True, random_state=42)
            balanced_dfs.append(label_df)
        df_balanced = pd.concat(balanced_dfs, ignore_index=True)
        df_balanced = df_balanced.sample(frac=1, random_state=42).reset_index(drop=True)
        print(f"Balanced distribution:\n{df_balanced['label'].value_counts()}")
        return df_balanced

    # ---------- ENHANCED PREPROCESSING ----------
    def preprocess(self, df):
        def clean_text(text):
            text = text.lower()
            text = re.sub(r'[^\w\s!?$%]', ' ', text)
            text = re.sub(r'\s+', ' ', text).strip()
            return text
        
        df['cleaned_text'] = df['text'].apply(clean_text)
        texts = df['cleaned_text'].apply(lambda x: x.split()).tolist()

        all_words = [w for sent in texts for w in sent]
        word_freq = Counter(all_words)
        words = [w for w, freq in word_freq.most_common(self.max_words) if freq >= 2]

        self.word2idx = {w: i + 1 for i, w in enumerate(words)}
        self.idx2word = {i + 1: w for i, w in enumerate(words)}
        print(f"Vocabulary size: {len(self.word2idx)}")

        X = []
        for sent in texts:
            seq = [self.word2idx.get(w, 0) for w in sent][:self.max_len]
            seq += [0] * (self.max_len - len(seq))
            X.append(seq)
        X = np.array(X)

        self.label_encoder = LabelEncoder()
        y = self.label_encoder.fit_transform(df['label'].tolist())
        print(f"Classes: {self.label_encoder.classes_}")

        # Feature engineering
        df['text_len'] = df['text'].apply(len)
        df['word_count'] = df['cleaned_text'].apply(lambda x: len(x.split()))
        df['num_digits'] = df['text'].apply(lambda x: sum(c.isdigit() for c in x))
        df['num_upper'] = df['text'].apply(lambda x: sum(c.isupper() for c in x))
        df['num_special'] = df['text'].apply(lambda x: sum(not c.isalnum() and not c.isspace() for c in x))
        df['avg_word_len'] = df['text_len'] / (df['word_count'] + 1)
        df['digit_ratio'] = df['num_digits'] / (df['text_len'] + 1)
        df['upper_ratio'] = df['num_upper'] / (df['text_len'] + 1)
        df['special_ratio'] = df['num_special'] / (df['text_len'] + 1)

        scam_keywords = ['urgent', 'click', 'free', 'winner', 'prize', 'congratulations', 
                         'claim', 'limited', 'act now', 'verify', 'suspended', 'account',
                         'password', 'bank', 'credit card', 'won', 'lottery', 'call now']
        df['scam_keyword_count'] = df['cleaned_text'].apply(
            lambda x: sum(1 for kw in scam_keywords if kw in x)
        )

        feature_cols = ['text_len', 'word_count', 'num_digits', 'num_upper', 'num_special',
                        'avg_word_len', 'digit_ratio', 'upper_ratio', 'special_ratio', 'scam_keyword_count']
        extra_features = df[feature_cols].values
        self.scaler = StandardScaler()
        extra_features = self.scaler.fit_transform(extra_features)
        print(f"Feature shape: {extra_features.shape}")

        return X, y, extra_features

    # ---------- TRAIN WITH VALIDATION ----------
    def train(self, X, y, extra_features=None, epochs=30, batch_size=32, lr=0.001, patience=5):
        X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
        if extra_features is not None:
            extra_train, extra_val = train_test_split(extra_features, test_size=0.2, random_state=42, stratify=y)
        else:
            extra_train, extra_val = None, None

        print(f"\nTraining samples: {len(X_train)}, Validation samples: {len(X_val)}")

        self.model = ImprovedBiLSTMAttention(
            vocab_size=len(self.word2idx) + 1,
            embed_dim=self.embed_dim,
            hidden_dim=self.hidden_dim,
            output_dim=len(set(y)),
            num_layers=3,
            dropout=0.4,
            extra_features_dim=extra_features.shape[1] if extra_features is not None else 0
        ).to(device)

        train_dataset = TextDataset(X_train, y_train, extra_train)
        val_dataset = TextDataset(X_val, y_val, extra_val)
        train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
        val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)

        criterion = nn.CrossEntropyLoss()
        optimizer = optim.AdamW(self.model.parameters(), lr=lr, weight_decay=1e-5)
        scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='max', factor=0.5, patience=3, verbose=True)

        best_val_acc = 0
        patience_counter = 0

        for epoch in range(epochs):
            # Training
            self.model.train()
            train_loss = 0
            train_correct = 0
            train_total = 0
            for batch in train_loader:
                if extra_features is not None:
                    xb, extra, yb = batch
                    xb, extra, yb = xb.to(device), extra.to(device), yb.to(device)
                    outputs = self.model(xb, extra)
                else:
                    xb, yb = batch
                    xb, yb = xb.to(device), yb.to(device)
                    outputs = self.model(xb)

                optimizer.zero_grad()
                loss = criterion(outputs, yb)
                loss.backward()
                torch.nn.utils.clip_grad_norm_(self.model.parameters(), max_norm=1.0)
                optimizer.step()

                train_loss += loss.item()
                _, predicted = torch.max(outputs.data, 1)
                train_total += yb.size(0)
                train_correct += (predicted == yb).sum().item()

            train_acc = 100 * train_correct / train_total

            # Validation
            self.model.eval()
            val_loss = 0
            val_correct = 0
            val_total = 0
            with torch.no_grad():
                for batch in val_loader:
                    if extra_features is not None:
                        xb, extra, yb = batch
                        xb, extra, yb = xb.to(device), extra.to(device), yb.to(device)
                        outputs = self.model(xb, extra)
                    else:
                        xb, yb = batch
                        xb, yb = xb.to(device), yb.to(device)
                        outputs = self.model(xb)
                    loss = criterion(outputs, yb)
                    val_loss += loss.item()
                    _, predicted = torch.max(outputs.data, 1)
                    val_total += yb.size(0)
                    val_correct += (predicted == yb).sum().item()

            val_acc = 100 * val_correct / val_total
            print(f"Epoch {epoch + 1}/{epochs}")
            print(f"  Train Loss: {train_loss/len(train_loader):.4f} | Train Acc: {train_acc:.2f}%")
            print(f"  Val Loss: {val_loss/len(val_loader):.4f} | Val Acc: {val_acc:.2f}%")

            scheduler.step(val_acc)
            if val_acc > best_val_acc:
                best_val_acc = val_acc
                patience_counter = 0
                torch.save(self.model.state_dict(), "best_model.pt")
            else:
                patience_counter += 1
                if patience_counter >= patience:
                    print(f"\nEarly stopping triggered after {epoch + 1} epochs")
                    break

        # Load best model (secure)
        self.model.load_state_dict(torch.load("best_model.pt", weights_only=True))
        print(f"\n✅ Best validation accuracy: {best_val_acc:.2f}%")
        self.evaluate(val_loader, extra_features is not None)

    # ---------- EVALUATION ----------
    def evaluate(self, data_loader, has_extra):
        self.model.eval()
        all_preds = []
        all_labels = []

        with torch.no_grad():
            for batch in data_loader:
                if has_extra:
                    xb, extra, yb = batch
                    xb, extra, yb = xb.to(device), extra.to(device), yb.to(device)
                    outputs = self.model(xb, extra)
                else:
                    xb, yb = batch
                    xb, yb = xb.to(device), yb.to(device)
                    outputs = self.model(xb)
                _, predicted = torch.max(outputs, 1)
                all_preds.extend(predicted.cpu().numpy())
                all_labels.extend(yb.cpu().numpy())

        print("\n" + "=" * 50)
        print("CLASSIFICATION REPORT")
        print("=" * 50)
        target_names = [str(c) for c in self.label_encoder.classes_]
        print(classification_report(all_labels, all_preds, target_names=target_names, digits=4))
        print("\nCONFUSION MATRIX")
        print(confusion_matrix(all_labels, all_preds))

    # -------- SAVE MODEL & METADATA --------
    def save(self, model_path="model.pt", vocab_path="vocab.json", labels_path="labels.json", scaler_path="scaler.json"):
        torch.save(self.model.state_dict(), model_path)
        with open(vocab_path, "w", encoding="utf-8") as f:
            json.dump({"word2idx": self.word2idx, "max_len": self.max_len}, f, indent=2)
        with open(labels_path, "w", encoding="utf-8") as f:
            json.dump(list(map(str, self.label_encoder.classes_)), f, indent=2)
        with open(scaler_path, "w", encoding="utf-8") as f:
            json.dump({"mean": self.scaler.mean_.tolist(), "scale": self.scaler.scale_.tolist()}, f, indent=2)
        print("\n✅ Saved files:")
        print(f" - {model_path}")
        print(f" - {vocab_path}")
        print(f" - {labels_path}")
        print(f" - {scaler_path}")

# ---------------- MAIN ----------------
if __name__ == "__main__":
    detector = ImprovedScamDetector(
        json_path="C:\\Users\\DELL\\Desktop\\archive\\label.json",
        max_words=3000,
        max_len=150,
        embed_dim=200,
        hidden_dim=256
    )
    df = detector.load_data()
    df = detector.balance_data(df)
    X, y, extra_features = detector.preprocess(df)
    detector.train(X, y, extra_features, epochs=30, batch_size=32, lr=0.001)
    detector.save()
