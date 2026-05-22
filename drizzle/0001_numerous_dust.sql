CREATE TABLE `characters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(64) NOT NULL,
	`description` text,
	`imageUrl` varchar(512),
	`unlockCost` int NOT NULL DEFAULT 0,
	`isDefault` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `characters_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chatMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`message` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chatMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `playerAnswers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`userId` int NOT NULL,
	`questionId` int NOT NULL,
	`selectedAnswer` varchar(512) NOT NULL,
	`isCorrect` boolean NOT NULL,
	`coinsEarned` int NOT NULL DEFAULT 0,
	`xpEarned` int NOT NULL DEFAULT 0,
	`timeSpent` int NOT NULL DEFAULT 0,
	`answeredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `playerAnswers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `playerCharacters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`characterId` int NOT NULL,
	`unlockedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `playerCharacters_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` varchar(64) NOT NULL,
	`difficulty` enum('easy','medium','hard','expert') NOT NULL,
	`question` text NOT NULL,
	`correctAnswer` varchar(512) NOT NULL,
	`optionA` varchar(512) NOT NULL,
	`optionB` varchar(512) NOT NULL,
	`optionC` varchar(512) NOT NULL,
	`optionD` varchar(512) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quizSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` varchar(64) NOT NULL,
	`category` varchar(64) NOT NULL,
	`difficulty` enum('easy','medium','hard','expert') NOT NULL,
	`status` enum('lobby','active','completed') NOT NULL DEFAULT 'lobby',
	`currentQuestionIndex` int NOT NULL DEFAULT 0,
	`totalQuestions` int NOT NULL DEFAULT 10,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`startedAt` timestamp,
	`completedAt` timestamp,
	CONSTRAINT `quizSessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sessionParticipants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`userId` int NOT NULL,
	`score` int NOT NULL DEFAULT 0,
	`coinsEarned` int NOT NULL DEFAULT 0,
	`xpEarned` int NOT NULL DEFAULT 0,
	`rank` int,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sessionParticipants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `coins` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `xp` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `level` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `activeCharacterId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `totalScore` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `gamesPlayed` int DEFAULT 0 NOT NULL;