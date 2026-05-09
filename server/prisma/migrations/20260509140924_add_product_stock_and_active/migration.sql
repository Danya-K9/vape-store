-- Add stock tracking fields for products.
-- Safe migration: adds nullable/int + boolean with default; no data loss.

ALTER TABLE `Product`
  ADD COLUMN `stock` INT NULL,
  ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true;

