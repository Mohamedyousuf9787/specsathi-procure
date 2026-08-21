CREATE TABLE `procurement_audit_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sessionKey` varchar(120) NOT NULL,
	`eventType` varchar(64) NOT NULL,
	`actor` varchar(96) NOT NULL,
	`itemId` varchar(120) NOT NULL,
	`summary` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `procurement_audit_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `procurement_audit_events_user_session_idx` ON `procurement_audit_events` (`userId`,`sessionKey`,`createdAt`);