-- AlterTable
ALTER TABLE `transactions` ADD COLUMN `fixed_expense_id` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `fixed_expenses` (
    `id` VARCHAR(191) NOT NULL,
    `group_id` VARCHAR(191) NOT NULL,
    `category_id` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `day_of_month` INTEGER NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `fixed_expenses` ADD CONSTRAINT `fixed_expenses_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fixed_expenses` ADD CONSTRAINT `fixed_expenses_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_fixed_expense_id_fkey` FOREIGN KEY (`fixed_expense_id`) REFERENCES `fixed_expenses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
