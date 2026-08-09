-- AlterTable
ALTER TABLE `transactions` ADD COLUMN `installment_id` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `installments` (
    `id` VARCHAR(191) NOT NULL,
    `group_id` VARCHAR(191) NOT NULL,
    `total_amount` DOUBLE NOT NULL,
    `installments_count` INTEGER NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `installments` ADD CONSTRAINT `installments_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_installment_id_fkey` FOREIGN KEY (`installment_id`) REFERENCES `installments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
