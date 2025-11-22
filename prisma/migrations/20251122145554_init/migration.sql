-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('DRAFT', 'OPEN', 'PAUSED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PlayerStatus" AS ENUM ('PENDING', 'NOMINATED', 'SOLD', 'UNSOLD');

-- CreateEnum
CREATE TYPE "BidStatus" AS ENUM ('VALID', 'RETRACTED', 'VOID');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuctionRoom" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sleeperId" TEXT,
    "status" "RoomStatus" NOT NULL DEFAULT 'DRAFT',
    "ownerId" TEXT NOT NULL,
    "settings" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuctionRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuctionTeam" (
    "id" TEXT NOT NULL,
    "auctionRoomId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerName" TEXT,
    "sleeperOwnerId" TEXT,
    "budget" DOUBLE PRECISION NOT NULL,
    "rosterSpots" INTEGER NOT NULL,
    "pinHash" TEXT,

    CONSTRAINT "AuctionTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuctionItem" (
    "id" TEXT NOT NULL,
    "auctionRoomId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "nflTeam" TEXT,
    "status" "PlayerStatus" NOT NULL DEFAULT 'PENDING',
    "winningBidId" TEXT,
    "winningTeamId" TEXT,
    "contractYears" INTEGER,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "AuctionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bid" (
    "id" TEXT NOT NULL,
    "auctionItemId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "contractYears" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "BidStatus" NOT NULL DEFAULT 'VALID',

    CONSTRAINT "Bid_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "AuctionTeam_auctionRoomId_idx" ON "AuctionTeam"("auctionRoomId");

-- CreateIndex
CREATE UNIQUE INDEX "AuctionItem_winningBidId_key" ON "AuctionItem"("winningBidId");

-- CreateIndex
CREATE INDEX "AuctionItem_auctionRoomId_idx" ON "AuctionItem"("auctionRoomId");

-- CreateIndex
CREATE INDEX "Bid_auctionItemId_idx" ON "Bid"("auctionItemId");

-- CreateIndex
CREATE INDEX "Bid_teamId_idx" ON "Bid"("teamId");

-- AddForeignKey
ALTER TABLE "AuctionRoom" ADD CONSTRAINT "AuctionRoom_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuctionTeam" ADD CONSTRAINT "AuctionTeam_auctionRoomId_fkey" FOREIGN KEY ("auctionRoomId") REFERENCES "AuctionRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuctionItem" ADD CONSTRAINT "AuctionItem_auctionRoomId_fkey" FOREIGN KEY ("auctionRoomId") REFERENCES "AuctionRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuctionItem" ADD CONSTRAINT "AuctionItem_winningBidId_fkey" FOREIGN KEY ("winningBidId") REFERENCES "Bid"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_auctionItemId_fkey" FOREIGN KEY ("auctionItemId") REFERENCES "AuctionItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "AuctionTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
