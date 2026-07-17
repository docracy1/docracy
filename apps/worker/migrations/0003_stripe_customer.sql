-- Links an account to its Stripe customer, so a later customer.subscription.deleted webhook
-- (which only carries a Stripe customer/subscription ID, not our account ID) can be resolved back
-- to the right account. Set once, on the first checkout.session.completed for that account.
ALTER TABLE accounts ADD COLUMN stripe_customer_id TEXT;
CREATE UNIQUE INDEX idx_accounts_stripe_customer_id ON accounts (stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
