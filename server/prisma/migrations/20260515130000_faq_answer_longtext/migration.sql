-- FAQ answer: LONGTEXT (fixes "value too long" if column was still VARCHAR).
ALTER TABLE `FaqItem` MODIFY `answer` LONGTEXT NOT NULL;
