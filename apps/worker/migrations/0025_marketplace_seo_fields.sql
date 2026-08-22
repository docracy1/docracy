-- Carries the same LLM/ChatGPT-optimization fields added to the static FreeTemplate catalog
-- (apps/web/src/lib/freeTemplates.ts) onto Marketplace submissions too, so a template approved
-- through the admin review queue gets the same treatment as a hand-curated one. All nullable:
-- older rows (and human-submitted templates that skip this optional detail) render fine without
-- them — CommunityTemplateDetail only shows a section when its field is present.
ALTER TABLE marketplace_templates ADD COLUMN definition TEXT;
ALTER TABLE marketplace_templates ADD COLUMN key_clauses TEXT;
ALTER TABLE marketplace_templates ADD COLUMN fill_in_fields TEXT;
ALTER TABLE marketplace_templates ADD COLUMN legal_summary TEXT;
ALTER TABLE marketplace_templates ADD COLUMN chatgpt_prompts TEXT;
