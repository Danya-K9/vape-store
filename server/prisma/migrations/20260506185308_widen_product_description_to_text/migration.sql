-- Widen product description fields to allow long text.
-- MySQL: switch from VARCHAR to TEXT.

ALTER TABLE `Product`
  MODIFY `description` TEXT NULL,
  MODIFY `fullDescription` TEXT NULL;

