-- FAQ: long answers; question cap 1000 (matches admin UI).
ALTER TABLE `FaqItem` MODIFY `answer` TEXT NOT NULL;
ALTER TABLE `FaqItem` MODIFY `question` VARCHAR(1000) NOT NULL;
