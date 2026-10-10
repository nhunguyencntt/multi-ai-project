-- v6.1: remove the obsolete "lost" asset status.
-- Preserve any legacy records by moving them to "retired" and keeping an audit note.
UPDATE assets
SET
  status = 'retired',
  note = CASE
    WHEN note IS NULL OR note = '' THEN 'Chuyển từ trạng thái cũ: Mất.'
    ELSE CONCAT(note, ' | Chuyển từ trạng thái cũ: Mất.')
  END
WHERE status = 'lost';

ALTER TABLE assets
  MODIFY COLUMN status enum('in_use','available','repair','damaged','retired') NOT NULL DEFAULT 'available';
