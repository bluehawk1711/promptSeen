'use client'

import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, LayoutDashboard, FileText, Tags, MessageSquare, Bell, BarChart3, Users, Settings, Image, Star, Search } from 'lucide-react'
import { PageTransition, FadeIn } from '@/components/motion/motion-components'

export default function HelpPage() {
  return (
    <PageTransition className="flex flex-col gap-6 max-w-3xl">
      {/* Header */}
      <FadeIn>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Help Center</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Everything you need to know about managing your Prompt View admin panel.
          </p>
        </div>
      </FadeIn>

      {/* Quick Start */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="size-4 text-primary" />
            Quick Start Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Welcome to the Prompt View Admin Panel! This is your central hub for managing all
            AI prompts, categories, user submissions, notifications, and app analytics.
            Use the sidebar to navigate between sections, and the search bar (⌘K) to quickly
            jump to any page.
          </p>
        </CardContent>
      </Card>

      {/* Sections */}
      <Accordion type="multiple" defaultValue={['dashboard']}>
        <AccordionItem value="dashboard">
          <AccordionTrigger>
            <div className="flex items-center gap-2.5">
              <LayoutDashboard className="size-4 text-primary" />
              Dashboard
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              <p>
                The <strong>Dashboard</strong> is your home screen. It gives you a real-time overview
                of your entire app at a glance.
              </p>
              <ul className="list-disc list-inside space-y-1.5">
                <li><strong>Greeting card</strong> — Shows "Good Morning/Afternoon/Evening" with the current date</li>
                <li><strong>App Overview</strong> — A quick summary of active prompts, categories, and total engagements with a donut chart</li>
                <li><strong>Key Metrics</strong> — Total Prompts, Categories, Users, and Submissions with trend indicators</li>
                <li><strong>Engagement Stats</strong> — Total Likes, Copies, and Shares across all prompts</li>
                <li><strong>Engagement Trend</strong> — A 14-day area chart showing likes, copies, and shares over time</li>
                <li><strong>Prompts by Category</strong> — Pie chart showing distribution of prompts across categories</li>
                <li><strong>Notification Stats</strong> — Notifications sent, delivery rate, and open rate</li>
              </ul>
              <p className="text-xs text-muted-foreground italic">
                Tip: All data refreshes automatically. The trend percentages compare this week vs last week.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="prompts">
          <AccordionTrigger>
            <div className="flex items-center gap-2.5">
              <FileText className="size-4 text-primary" />
              Prompts
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              <p>
                The <strong>Prompts</strong> page is where you manage all AI prompts displayed in the mobile app.
              </p>
              <ul className="list-disc list-inside space-y-1.5">
                <li><strong>Create prompt</strong> — Click "Add Prompt" to open the form. Upload an image (via Cloudinary), write the prompt text, assign a category, add tags, and set active/premium status.</li>
                <li><strong>Edit prompt</strong> — Hover over any row and click the ⋮ menu → Edit. You can update any field including the image.</li>
                <li><strong>Delete prompt</strong> — Click ⋮ → Delete. The image will also be removed from Cloudinary.</li>
                <li><strong>Search</strong> — Type in the search bar to filter prompts by text or tags.</li>
                <li><strong>Engagement</strong> — Each row shows likes, copies, and shares counts.</li>
                <li><strong>Status</strong> — Green eye icon = active, gray = hidden, star = premium.</li>
              </ul>
              <p className="text-xs text-muted-foreground italic">
                Tip: When you create a new prompt and auto-notifications are enabled, all users will receive a push notification automatically.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="categories">
          <AccordionTrigger>
            <div className="flex items-center gap-2.5">
              <Tags className="size-4 text-primary" />
              Categories
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              <p>
                <strong>Categories</strong> help organize prompts into groups like Marketing, Creative, Business, etc.
              </p>
              <ul className="list-disc list-inside space-y-1.5">
                <li><strong>Create category</strong> — Click "Add Category", enter a name (slug auto-generates), and save.</li>
                <li><strong>Edit category</strong> — Click ⋮ → Edit on any row. You can change the name and active status.</li>
                <li><strong>Delete category</strong> — Prompts in this category will become uncategorized.</li>
                <li><strong>Active/Hidden</strong> — Toggle whether a category appears in the mobile app.</li>
              </ul>
              <p className="text-xs text-muted-foreground italic">
                Tip: Categories are shown as filter chips in the mobile app. Keep them concise and relevant.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="submissions">
          <AccordionTrigger>
            <div className="flex items-center gap-2.5">
              <MessageSquare className="size-4 text-primary" />
              Submissions
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              <p>
                <strong>Submissions</strong> are prompts submitted by mobile app users for your review.
              </p>
              <ul className="list-disc list-inside space-y-1.5">
                <li><strong>Pending</strong> — New submissions waiting for your review (shown by default)</li>
                <li><strong>Approve</strong> — Click "Review" → assign a category → click "Approve & Publish". This creates a new prompt automatically.</li>
                <li><strong>Reject</strong> — Click "Review" → optionally add a note → click "Reject".</li>
                <li><strong>Filter tabs</strong> — Switch between Pending, All, Approved, and Rejected views.</li>
              </ul>
              <p className="text-xs text-muted-foreground italic">
                Tip: Approving a submission automatically creates a new prompt in the database. You can edit it afterwards from the Prompts page.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="notifications">
          <AccordionTrigger>
            <div className="flex items-center gap-2.5">
              <Bell className="size-4 text-primary" />
              Notifications
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              <p>
                <strong>Notifications</strong> let you send push notifications to all app users and track their engagement.
              </p>
              <ul className="list-disc list-inside space-y-1.5">
                <li><strong>Compose</strong> — Enter a title (max 100 chars), body text (max 500 chars), and optionally an image URL.</li>
                <li><strong>Target</strong> — Send to All users, a specific Topic, or a single device Token.</li>
                <li><strong>Send</strong> — Click "Send Notification" to deliver immediately via Expo Push API.</li>
                <li><strong>Auto-notifications</strong> — Toggle "New Prompt Alert" to automatically notify users when a new prompt is created.</li>
                <li><strong>Analytics</strong> — Track delivery rate, open rate, and engagement per notification in the history table.</li>
                <li><strong>Date range</strong> — Filter analytics by 7, 14, 30, or 90 days.</li>
              </ul>
              <p className="text-xs text-muted-foreground italic">
                Tip: High open rates (15%+) indicate good notification content. Test different titles to improve engagement.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="analytics">
          <AccordionTrigger>
            <div className="flex items-center gap-2.5">
              <BarChart3 className="size-4 text-primary" />
              Analytics
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              <p>
                <strong>Analytics</strong> shows detailed engagement metrics collected from user interactions in the mobile app.
              </p>
              <ul className="list-disc list-inside space-y-1.5">
                <li><strong>Active Users</strong> — Unique users who opened the app each day</li>
                <li><strong>Prompt Views</strong> — Total times prompts were viewed</li>
                <li><strong>Likes, Copies, Shares</strong> — Engagement counts aggregated daily</li>
                <li><strong>Daily Breakdown</strong> — Scrollable list of all daily stats with per-metric counts</li>
                <li><strong>Top Prompts</strong> — Prompts ranked by likes, with copies and shares shown</li>
                <li><strong>Date range</strong> — Toggle between 7-day and 30-day views</li>
              </ul>
              <p className="text-xs text-muted-foreground italic">
                Tip: Check analytics weekly to identify trending prompts and popular categories.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="users">
          <AccordionTrigger>
            <div className="flex items-center gap-2.5">
              <Users className="size-4 text-primary" />
              Users
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              <p>
                The <strong>Users</strong> page lists all registered users of the mobile app.
              </p>
              <ul className="list-disc list-inside space-y-1.5">
                <li>View user profiles including email, display name, and join date</li>
                <li>See each user's favorite prompts and engagement stats</li>
                <li>Monitor user growth over time in the Analytics section</li>
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="settings">
          <AccordionTrigger>
            <div className="flex items-center gap-2.5">
              <Settings className="size-4 text-primary" />
              Settings & Backup
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              <p>
                <strong>Settings</strong> provides backup/restore tools and system information.
              </p>
              <ul className="list-disc list-inside space-y-1.5">
                <li><strong>Export Backup</strong> — Downloads all Firestore data (prompts, categories, users) as a JSON file. Use before bulk changes.</li>
                <li><strong>Restore Backup</strong> — Upload a JSON backup file to restore data. Existing documents with the same ID are overwritten.</li>
                <li><strong>Firebase Project</strong> — Shows your current Firebase project ID and region.</li>
                <li><strong>Security Rules</strong> — Lists the active Firestore and Storage rules files.</li>
              </ul>
              <p className="text-xs text-muted-foreground italic">
                Tip: Export a backup before making major changes. Keep backup files in a safe location.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="images">
          <AccordionTrigger>
            <div className="flex items-center gap-2.5">
              <Image className="size-4 text-primary" />
              Image Upload & Cloudinary
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              <p>
                All prompt images are managed through <strong>Cloudinary</strong> for optimized delivery.
              </p>
              <ul className="list-disc list-inside space-y-1.5">
                <li><strong>Upload</strong> — Drag & drop or click to select an image. Images are automatically compressed and optimized before upload.</li>
                <li><strong>Supported formats</strong> — JPG, PNG, WebP. Max file size varies by plan.</li>
                <li><strong>Replace</strong> — When editing a prompt, you can replace the image. The old image is automatically deleted from Cloudinary.</li>
                <li><strong>Optimization</strong> — Images are resized and compressed for fast mobile loading.</li>
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="search">
          <AccordionTrigger>
            <div className="flex items-center gap-2.5">
              <Search className="size-4 text-primary" />
              Search & Keyboard Shortcuts
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              <p>
                The admin panel supports fast navigation via keyboard shortcuts.
              </p>
              <ul className="list-disc list-inside space-y-1.5">
                <li><strong>⌘K / Ctrl+K</strong> — Opens the search command palette. Type to filter pages, use ↑↓ to navigate, Enter to select.</li>
                <li><strong>ESC</strong> — Closes the search modal or any open dialog.</li>
                <li><strong>Sidebar search</strong> — Click the search bar in the header to access it.</li>
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="darkmode">
          <AccordionTrigger>
            <div className="flex items-center gap-2.5">
              <Star className="size-4 text-primary" />
              Dark Mode
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              <p>
                The admin panel supports both light and dark themes.
              </p>
              <ul className="list-disc list-inside space-y-1.5">
                <li><strong>Toggle</strong> — Click the sun/moon icon in the top-right header to switch themes.</li>
                <li><strong>System</strong> — By default, the theme follows your system preference.</li>
                <li><strong>Persistence</strong> — Your theme choice is saved and persists across sessions.</li>
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </PageTransition>
  )
}
