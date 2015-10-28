CREATE TABLE IF NOT EXISTS `translations` (
  `sentence` varchar(100) COLLATE utf8_bin NOT NULL,
  KEY `sentence` (`sentence`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
