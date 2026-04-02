FROM python:3.10-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Default command (can be overridden)
CMD ["python", "edge_ai.py", "--container-id", "DEMO001", "--product-type", "mangoes"]
