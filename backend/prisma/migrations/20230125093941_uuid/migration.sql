-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Badgeage" (
    "id" SERIAL NOT NULL,
    "day" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "premiereEntree" TIMESTAMP(3),
    "premiereSortie" TIMESTAMP(3),
    "deuxiemeEntree" TIMESTAMP(3),
    "deuxiemeSortie" TIMESTAMP(3),
    "userId" UUID NOT NULL,

    CONSTRAINT "Badgeage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- AddForeignKey
ALTER TABLE "Badgeage" ADD CONSTRAINT "Badgeage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
