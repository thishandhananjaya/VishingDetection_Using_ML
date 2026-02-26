export const sampleCalls = [
{
id: '1', caller: 'unknown', datetime: '2025-10-10T12:34:00Z', risk: 87, status: 'Suspicious',
transcript: 'Hello, your OTP is 123456. Please provide it to confirm.', highlights: ['OTP','urgent','confirm']
},
{
id: '2', caller: '+94123456789', datetime: '2025-09-21T09:10:00Z', risk: 12, status: 'Safe',
transcript: 'I would like to check my bill payments.', highlights: []
},
{
    id: '3',
    caller: 'unknown',
    datetime: '2025-10-15T14:22:00Z',
    risk: 92,
    status: 'High Risk',
    transcript: 'Your account has been compromised. Share your password to secure it now.',
    highlights: ['account', 'compromised', 'password', 'urgent']
  },
  {
    id: '4',
    caller: '+12025550123',
    datetime: '2025-10-18T08:45:00Z',
    risk: 25,
    status: 'Safe',
    transcript: 'Hello, this is your dentist’s office confirming your appointment tomorrow.',
    highlights: ['appointment', 'confirm']
  },
  {
    id: '5',
    caller: 'unknown',
    datetime: '2025-10-20T16:05:00Z',
    risk: 78,
    status: 'Suspicious',
    transcript: 'You’ve won a $500 gift card! Click the link to claim it now.',
    highlights: ['won', 'gift card', 'claim', 'link']
  },
  {
    id: '6',
    caller: '+447890123456',
    datetime: '2025-10-21T10:00:00Z',
    risk: 5,
    status: 'Safe',
    transcript: 'Hi, this is your bank confirming a recent transaction of $50.',
    highlights: ['bank', 'transaction']
  }
]