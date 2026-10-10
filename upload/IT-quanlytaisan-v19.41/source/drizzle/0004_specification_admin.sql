-- 0004: Quản trị cấu hình thông số kỹ thuật.
-- Giữ dữ liệu legacy để tương thích nhưng không hiển thị như trường kỹ thuật mới.
UPDATE `assetSpecificationFields` SET `active` = 0 WHERE `code` = 'legacy_specifications';
