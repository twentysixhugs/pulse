# **App Name**: TeleTrader Hub

## Core Features:

- User Alert Feed: Displays alerts from followed traders in real-time, including text and zoomable screenshots. Users can like/dislike posts, leave comments, and report posts to admins. Data updates in real-time.
- Trader Profile and Rating: Allows users to view trader profiles with post history. Users can give +rep or -rep to traders (one of each, can be removed). Trader profiles display trader's specialization category.
- Trader Alert Posting: Enables traders to create, edit, and delete their posts with text and screenshot attachments. Traders can set their account status to Active/Inactive, which controls whether their data is displayed.
- Admin User Management: Provides an interface for admins to manage users (ban/delete, view Telegram ID). Admins can also unban users.
- Admin Trader Management: Enables admins to manage traders (edit posts, delete, deactivate/activate, view Telegram ID and profile details).
- Admin Complaint Handling: Allows admins to view and resolve user complaints related to posts.
- Access Validation: Validates user access based on subscription status to https://t.me/fashopet983jrt292rk01jf9h3f8j. Includes simulation of payment access checks, and handles displaying legal documents before use.
- Telegram Authentication: All roles (user, trader, admin) authenticate via Telegram WebApp init data, backed by Firebase custom tokens. Access is granted per-role based on configuration in Firestore.
- Category Browsing: Users can browse traders by category, with an 'All' category as the default. Categories are displayed in an expandable list.
- Image Zoom: Users can zoom into screenshots after opening them. If not opened, a button allows opening the screenshot in the browser.
- Legal Documents: Displays legal documents to the user before they can use the bot.
- Subscription Check: Verifies if the user is subscribed to the required Telegram channels before granting access to the bot's features. The check is performed on the backend.
- Payment Access Simulation: Simulates payment access checks for future integration with CryptoCloud or similar services. User access to the mini-app's functionality is controlled based on subscription status.
- User Tabs and Navigation: Three tabs: 'All Alerts', 'Categories', and 'Rating'. 'All Alerts' displays all alerts. 'Categories' displays an expandable list of trader categories, each of which can be expanded to show the traders in that category. 'Rating' displays a list of traders sorted by rating. Navigation allows users to go to a trader's profile from the 'Categories' and 'Rating' tabs.
- Trader Status: Traders can set their status to Active/Inactive. When a trader is inactive, their data is no longer displayed to users.
- Admin User Ban/Unban: Admins can ban and unban users.
- Admin Trader Activation/Deactivation: Admins can activate and deactivate traders.
- Admin Trader Deletion: Admins can permanently delete a trader, removing all their data from the database.
- Trader Profile Duplication: The trader profile view in the trader app duplicates the functionality of the open trader profile in the user app, allowing traders to view other traders' profiles.

## Style Guidelines:

- Primary color: Dark Orange (#FF8C00) for a modern and dynamic feel, representing the fast-paced nature of trading.
- Background color: Deep Charcoal (#121212), providing a sophisticated and professional backdrop.
- Accent color: Gold (#FFD700) used sparingly for highlights and calls to action to maintain focus and clarity.
- Headline font: 'Space Grotesk' sans-serif for a clean, modern look in headings.
- Body font: 'Inter', sans-serif for readability.
- Code font: 'Source Code Pro' monospace, if and when any code needs to be displayed.
- Use crisp, minimalist icons to represent different trading categories and actions.
- Implement a modular layout with clear separation of concerns for alerts, profiles, and admin functions. Optimize for mobile responsiveness.