# weCare

**Dementia Support & Care Management Platform**

weCare is a web-based care management platform designed to help people living with dementia and their caregivers coordinate daily care, routines, reminders, progress, and shared information through a secure and structured system.

## Overview

The platform provides separate patient and caregiver experiences with role-based access to care features. It focuses on simplifying everyday care coordination while giving patients control over privacy-sensitive functionality.

## Key Features

- **Role-Based Accounts** — Separate patient and caregiver access with protected routes and authorization.
- **Caregiver Invitations** — Connect patients and caregivers through secure invitation codes.
- **Daily Care Planning** — Create and manage routines, reminders, and daily activities.
- **Progress Tracking** — Caregivers can monitor completion of assigned daily plans.
- **Care Notes** — Share and manage relevant care information between connected users.
- **Memory Album** — Maintain a private collection of personal photos and memories.
- **Temporary Location Sharing** — Patients can voluntarily share their location for up to 30 minutes.
- **Weather Integration** — Retrieve local weather information through the Open-Meteo API.
- **Image Uploads** — Support for common image formats with controlled upload limits.

## Technology Stack

**Frontend**
- React
- Tailwind CSS

**Backend**
- Node.js
- Express.js

**Database**
- MongoDB

**External Services**
- Open-Meteo API

## Engineering Focus

- RESTful backend services
- Database-driven application design
- Authentication and authorization
- Role-based access control
- Protected application routes
- Third-party API integration
- File upload handling
- Privacy-aware feature design

## Privacy & Security

weCare implements access controls around patient and caregiver functionality and limits sensitive features according to user permissions.

Location sharing is explicitly controlled by the patient and is temporary. The application does **not** provide continuous background tracking or emergency location monitoring.

## Project

**Repository:** [github.com/yemizerfe/weCare](https://github.com/yemizerfe/weCare)

## Author

**Yemisrach Zerfe**  
Backend Software Engineer

