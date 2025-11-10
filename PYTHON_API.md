# LogIz - Python API Setup

## Quick Start

1. **Install Python dependencies:**
```bash
pip install -r requirements.txt
```

2. **Run the mock API:**
```bash
python python_api.py
```

The API will start on `http://localhost:8000`

## API Endpoints

### Health Check
```
GET http://localhost:8000/health
```

### Analyze Log
```
POST http://localhost:8000/analyze
Content-Type: application/json

{
  "log_content": "your log content here",
  "filename": "app.log",
  "file_type": ".log"
}
```

## Integration with Your Model

Replace the `generate_mock_threats()` function with your trained model:

```python
def analyze_with_ai_model(log_content):
    # Load your trained model
    model = load_your_model()
    
    # Preprocess the log
    processed = preprocess_log(log_content)
    
    # Get predictions
    predictions = model.predict(processed)
    
    # Format as threats
    threats = format_predictions(predictions)
    
    return threats
```

## Environment Variables

Create a `.env` file:
```
FLASK_ENV=development
MODEL_PATH=./models/your_model.pkl
API_KEY=your-secret-api-key
```
