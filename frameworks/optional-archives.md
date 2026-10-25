Optional MongoDB and AWS adapters
=================================

The SQL database remains the source of truth for accounts, organizations and ERP transactions. These helpers are opt-in second destinations for sanitized audit metadata and filtered JSON backups.

MongoDB: set MONGODB_URI. MONGODB_DATABASE optionally selects the archive database. Only a limited audit envelope is stored; passwords, cookie tokens and full transaction payloads are excluded.

Amazon S3: set AVERIS_S3_BUCKET and AWS_REGION. Use an AWS IAM role or the normal SDK credential chain rather than embedding cloud keys in code. AVERIS_S3_SSE_KMS_KEY_ID optionally selects a KMS key.

Install with pip install -r requirements-integrations.txt. No data is sent to MongoDB or S3 automatically; call the helpers explicitly after selecting synthetic data to archive. Treat these as integration examples, not enabled production integrations.
