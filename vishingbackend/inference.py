import torch
import torch.nn as nn
import json
import re
import numpy as np
import os

# --- Model Architecture (must match train.py) ---
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

class ScamInference:
    def __init__(self, model_path, vocab_path, labels_path, scaler_path):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        # Load metadata
        with open(vocab_path, "r", encoding="utf-8") as f:
            meta = json.load(f)
            self.word2idx = meta["word2idx"]
            self.max_len = meta["max_len"]
            
        with open(labels_path, "r", encoding="utf-8") as f:
            self.labels = json.load(f)
            
        with open(scaler_path, "r", encoding="utf-8") as f:
            scaler_data = json.load(f)
            self.mean = np.array(scaler_data["mean"])
            self.scale = np.array(scaler_data["scale"])
            
        # Initialize model
        self.model = ImprovedBiLSTMAttention(
            vocab_size=len(self.word2idx) + 1,
            embed_dim=200,
            hidden_dim=256,
            output_dim=len(self.labels),
            num_layers=3,
            dropout=0.4,
            extra_features_dim=len(self.mean)
        ).to(self.device)
        
        self.model.load_state_dict(torch.load(model_path, map_location=self.device, weights_only=True))
        self.model.eval()

    def clean_text(self, text):
        text = text.lower()
        text = re.sub(r'[^\w\s!?$%]', ' ', text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text

    def extract_features(self, original_text, cleaned_text):
        text_len = len(original_text)
        word_count = len(cleaned_text.split())
        num_digits = sum(c.isdigit() for c in original_text)
        num_upper = sum(c.isupper() for c in original_text)
        num_special = sum(not c.isalnum() and not c.isspace() for c in original_text)
        avg_word_len = text_len / (word_count + 1)
        digit_ratio = num_digits / (text_len + 1)
        upper_ratio = num_upper / (text_len + 1)
        special_ratio = num_special / (text_len + 1)
        
        scam_keywords = ['urgent', 'click', 'free', 'winner', 'prize', 'congratulations', 
                         'claim', 'limited', 'act now', 'verify', 'suspended', 'account',
                         'password', 'bank', 'credit card', 'won', 'lottery', 'call now']
        keyword_count = sum(1 for kw in scam_keywords if kw in cleaned_text)
        
        features = np.array([
            text_len, word_count, num_digits, num_upper, num_special,
            avg_word_len, digit_ratio, upper_ratio, special_ratio, keyword_count
        ])
        
        # Scale features
        features = (features - self.mean) / self.scale
        return torch.tensor(features, dtype=torch.float).unsqueeze(0).to(self.device)

    def predict(self, text):
        cleaned = self.clean_text(text)
        
        # Tokenize
        words = cleaned.split()
        seq = [self.word2idx.get(w, 0) for w in words][:self.max_len]
        seq += [0] * (self.max_len - len(seq))
        x = torch.tensor(seq, dtype=torch.long).unsqueeze(0).to(self.device)
        
        # Extra features
        extra = self.extract_features(text, cleaned)
        
        with torch.no_grad():
            outputs = self.model(x, extra)
            probs = torch.softmax(outputs, dim=1)
            confidence, predicted = torch.max(probs, 1)
            
        return {
            "prediction": self.labels[predicted.item()],
            "confidence": round(confidence.item() * 100, 2),
            "text": text
        }
