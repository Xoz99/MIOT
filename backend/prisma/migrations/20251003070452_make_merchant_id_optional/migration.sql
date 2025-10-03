-- AlterTable
ALTER TABLE "merchants" ADD COLUMN     "role" VARCHAR(50) NOT NULL DEFAULT 'merchants';

-- AlterTable
ALTER TABLE "rfid_cards" ADD COLUMN     "owner_name" VARCHAR(255),
ADD COLUMN     "phone" VARCHAR(20);
