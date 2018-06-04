-- phpMyAdmin SQL Dump
-- version 4.7.2
-- https://www.phpmyadmin.net/
--
-- Host: db
-- Generation Time: Aug 25, 2017 at 09:01 AM
-- Server version: 5.7.18
-- PHP Version: 7.0.16

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `gal_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `Passenger`
--

CREATE TABLE `Passenger` (
  `id` int(11) NOT NULL COMMENT 'The ID of the row',
  `ride` int(11) DEFAULT NULL COMMENT 'The route id linked to the passenger',
  `passenger` int(11) DEFAULT NULL COMMENT 'The passenger ID linked to the route'
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='List of all the passengers for the rides';

-- --------------------------------------------------------

--
-- Table structure for table `Rating`
--

CREATE TABLE `Rating` (
  `id` int(11) NOT NULL COMMENT 'The comment ID',
  `author` int(11) DEFAULT NULL COMMENT 'The User ID of the author of the comment',
  `target` int(11) DEFAULT NULL COMMENT 'The User ID of the target of the comment',
  `ride` int(11) DEFAULT NULL COMMENT 'The Ride ID linked to this comment',
  `stars` int(5) NOT NULL COMMENT 'How many stars did the author reward the target ?',
  `comment` text COMMENT 'The text content of the comment.',
  `postDate` datetime NOT NULL COMMENT 'At which date did the author made this comment ?'
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='All the ratings and the comments writed by users';

-- --------------------------------------------------------

--
-- Table structure for table `Ride`
--

CREATE TABLE `Ride` (
  `id` int(11) NOT NULL COMMENT 'The id of the ride',
  `route` int(11) DEFAULT NULL COMMENT 'The route attached to this ride'
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='A ride is an instance of a route';

-- --------------------------------------------------------

--
-- Table structure for table `FavoriteRoute`
--

CREATE TABLE `FavoriteRoute` (
  `id` int(11) NOT NULL COMMENT 'The id of the favoriteRoute',
  `routeId` int(11) DEFAULT NULL COMMENT 'The route attached to this save',
  `userId` int(11) DEFAULT NULL COMMENT 'The user attached to this save' 
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='A FavoriteRoute is an instance of a route';


-- --------------------------------------------------------

--
-- Table structure for table `Route`
--

CREATE TABLE `Route` (
  `id` int(11) NOT NULL COMMENT 'The id of the route',
  `startingPoint` point NOT NULL COMMENT 'The geographical point at the beginning of the route',
  `endPoint` point NOT NULL COMMENT 'The geographical point at the end of the route',
  `driver` int(11) DEFAULT NULL COMMENT 'The user that created this route',
  `originAdress` varchar(128) NOT NULL COMMENT 'The adress of the origin of the route',
  `destinationAdress` varchar(128) NOT NULL COMMENT 'The adress of the destination of the route',
  `distance` varchar(64) NOT NULL COMMENT 'The distance between the origin and the destination of the route' ,
  `duration` varchar(64) NOT NULL COMMENT 'the duration of the route' 
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='List all the routes recorded in the app';

-- --------------------------------------------------------

--
-- Table structure for table `RouteDate`
--

CREATE TABLE `RouteDate` (
  `id` int(11) NOT NULL COMMENT 'The ID of the route meta line',
  `route` int(11) NOT NULL COMMENT 'The route linked to this meta',
  `route_date` datetime NOT NULL COMMENT 'First date of the repeat. It''s assumed to be every week starting from this day.',
  `weekly_repeat` tinyint(1) NOT NULL COMMENT 'Is this date must be repeated every week ?'
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='The dates for every routes';

-- --------------------------------------------------------

--
-- Table structure for table `RoutePoints`
--

CREATE TABLE `RoutePoints` (
  `id` int(11) NOT NULL COMMENT 'The ID of the route point',
  `route` int(11) DEFAULT NULL COMMENT 'The route linked to this point',
  `point_rank` int(11) NOT NULL COMMENT 'It''s the order of this point in the point list of the route',
  `point` point NOT NULL COMMENT 'The geographical coordinates of this point',
  `seconds_from_start` int(11) NOT NULL COMMENT 'An estimation of the number of seconds passed since the start of the route'
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='All the geographical points that compose the routes';

-- --------------------------------------------------------

--
-- Table structure for table `User`
--

CREATE TABLE `User` (
  `id` int(11) NOT NULL COMMENT 'The ID of the User',
  `username` varchar(64) NOT NULL COMMENT 'The user''s Username',
  `password` char(60) NOT NULL COMMENT 'The user''s password',
  `name` varchar(64) DEFAULT NULL COMMENT 'the user''s first name',
  `surname` varchar(64) DEFAULT NULL COMMENT 'the user''s last name',
  `email` varchar(64) DEFAULT NULL COMMENT 'the user''s email address',
  `mobileNumber` varchar(16) DEFAULT NULL COMMENT 'the user''s mobile number',
  `isVerified` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Is the user verified ?'
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='All the users of the app';

--
-- Indexes for dumped tables
--

--
-- Indexes for table `Passenger`
--
ALTER TABLE `Passenger`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ride` (`ride`),
  ADD KEY `passenger` (`passenger`);

--
-- Indexes for table `Rating`
--
ALTER TABLE `Rating`
  ADD PRIMARY KEY (`id`),
  ADD KEY `target` (`target`),
  ADD KEY `author` (`author`),
  ADD KEY `ride` (`ride`);

--
-- Indexes for table `Ride`
--
ALTER TABLE `Ride`
  ADD PRIMARY KEY (`id`),
  ADD KEY `route` (`route`);

--
-- Indexes for table `Ride`
--
ALTER TABLE `FavoriteRoute`
  ADD PRIMARY KEY (`id`);
  


--
-- Indexes for table `Route`
--
ALTER TABLE `Route`
  ADD PRIMARY KEY (`id`),
  ADD KEY `driver` (`driver`);

--
-- Indexes for table `RouteDate`
--
ALTER TABLE `RouteDate`
  ADD PRIMARY KEY (`id`),
  ADD KEY `route_id` (`route`);

--
-- Indexes for table `RoutePoints`
--
ALTER TABLE `RoutePoints`
  ADD PRIMARY KEY (`id`),
  ADD KEY `RoutePoints_ibfk_1` (`route`);

--
-- Indexes for table `User`
--
ALTER TABLE `User`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `Passenger`
--
ALTER TABLE `Passenger`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'The ID of the row';
--
-- AUTO_INCREMENT for table `Rating`
--
ALTER TABLE `Rating`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'The comment ID';
--
-- AUTO_INCREMENT for table `Ride`
--
ALTER TABLE `Ride`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'The id of the ride';
  
--
-- AUTO_INCREMENT for table `Ride`
--
ALTER TABLE `FavoriteRoute`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'The id of the FavoriteRoute';
--
-- AUTO_INCREMENT for table `Route`
--
ALTER TABLE `Route`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'The id of the route', AUTO_INCREMENT=4;
--
-- AUTO_INCREMENT for table `RouteDate`
--
ALTER TABLE `RouteDate`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'The ID of the route meta line', AUTO_INCREMENT=3;
--
-- AUTO_INCREMENT for table `RoutePoints`
--
ALTER TABLE `RoutePoints`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'The ID of the route point', AUTO_INCREMENT=40;
--
-- AUTO_INCREMENT for table `User`
--
ALTER TABLE `User`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'The ID of the User', AUTO_INCREMENT=2;
--
-- Constraints for dumped tables
--

--
-- Constraints for table `Passenger`
--
ALTER TABLE `Passenger`
  ADD CONSTRAINT `Passenger_ibfk_1` FOREIGN KEY (`ride`) REFERENCES `Ride` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Passenger_ibfk_2` FOREIGN KEY (`passenger`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `Rating`
--
ALTER TABLE `Rating`
  ADD CONSTRAINT `Rating_ibfk_1` FOREIGN KEY (`target`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Rating_ibfk_2` FOREIGN KEY (`author`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Rating_ibfk_3` FOREIGN KEY (`ride`) REFERENCES `Ride` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `Ride`
--
ALTER TABLE `Ride`
  ADD CONSTRAINT `Ride_ibfk_1` FOREIGN KEY (`route`) REFERENCES `Route` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `Ride`
--
ALTER TABLE `FavoriteRoute`
  ADD CONSTRAINT `FavoriteRoute_ibfk_1` FOREIGN KEY (`routeId`) REFERENCES `Route` (`id`) ON DELETE CASCADE;


--
-- Constraints for table `Route`
--
ALTER TABLE `Route`
  ADD CONSTRAINT `Route_ibfk_1` FOREIGN KEY (`driver`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `RouteDate`
--
ALTER TABLE `RouteDate`
  ADD CONSTRAINT `RouteDate_ibfk_1` FOREIGN KEY (`route`) REFERENCES `Route` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `RoutePoints`
--
ALTER TABLE `RoutePoints`
  ADD CONSTRAINT `RoutePoints_ibfk_1` FOREIGN KEY (`route`) REFERENCES `Route` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
