CREATE TABLE `support_conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`publicId` varchar(64) NOT NULL,
	`channel` varchar(32) NOT NULL DEFAULT 'web',
	`customerName` varchar(160),
	`status` enum('open','pending','resolved','closed') NOT NULL DEFAULT 'open',
	`intent` varchar(160),
	`summary` text,
	`firstResponseAt` timestamp,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `support_conversations_id` PRIMARY KEY(`id`),
	CONSTRAINT `support_conversations_publicId_unique` UNIQUE(`publicId`)
);
--> statement-breakpoint
CREATE TABLE `support_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`role` enum('customer','assistant','agent','system') NOT NULL,
	`content` text NOT NULL,
	`channelMessageId` varchar(160),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`responderUserId` int,
	CONSTRAINT `support_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `support_ticket_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketId` int NOT NULL,
	`eventType` varchar(64) NOT NULL,
	`note` text,
	`actorUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `support_ticket_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `support_tickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketNo` varchar(32) NOT NULL,
	`conversationId` int NOT NULL,
	`status` enum('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
	`reason` varchar(255) NOT NULL,
	`summary` text NOT NULL,
	`missingFields` text,
	`createdBy` int,
	`assignedTo` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`resolvedAt` timestamp,
	CONSTRAINT `support_tickets_id` PRIMARY KEY(`id`),
	CONSTRAINT `support_tickets_ticketNo_unique` UNIQUE(`ticketNo`)
);
