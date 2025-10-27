# Supabase anon key secret
resource "google_secret_manager_secret" "supabase_anon_key" {
  secret_id = "supabase-anon-key-${var.environment}"

  replication {
    auto {}
  }
}

# ElevenLabs API key secret
resource "google_secret_manager_secret" "elevenlabs_key" {
  secret_id = "elevenlabs-api-key-${var.environment}"

  replication {
    auto {}
  }
}
