import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";

export default function Dashboard() {
  // Get athlete data from localStorage or state
  const athleteName = localStorage.getItem('athleteName') || 'Strava Athlete';
  const athleteImage = localStorage.getItem('athleteImage') || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {athleteImage ? (
                <img src={athleteImage} alt="Athlete avatar" className="w-10 h-10 rounded-full border border-gray-200" />
              ) : null}
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
                  Welcome back, {athleteName.split(' ')[0]}!
                </h1>
                <p className="text-lg text-slate-600 mt-2">
                  Your Strava analytics dashboard
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="text-sky-600 bg-sky-50 border-sky-200">
              Connected
            </Badge>
          </div>
          <Separator />
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Overview Cards */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Activity Overview</CardTitle>
                <CardDescription>
                  Your recent Strava activities and performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <div className="text-2xl font-bold text-slate-900">24</div>
                    <div className="text-sm text-slate-600">Activities</div>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <div className="text-2xl font-bold text-slate-900">156.7</div>
                    <div className="text-sm text-slate-600">Total Miles</div>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <div className="text-2xl font-bold text-slate-900">12.5</div>
                    <div className="text-sm text-slate-600">Hours</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
                <CardDescription>
                  Your latest workouts and achievements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-semibold">Morning Run</div>
                      <div className="text-sm text-slate-600">5.2 miles • 42:15</div>
                    </div>
                    <Badge variant="outline">Running</Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-semibold">Cycling Workout</div>
                      <div className="text-sm text-slate-600">18.7 miles • 1:12:30</div>
                    </div>
                    <Badge variant="outline">Cycling</Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-semibold">Strength Training</div>
                      <div className="text-sm text-slate-600">45 minutes</div>
                    </div>
                    <Badge variant="outline">Weight Training</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" variant="default">
                  Sync Activities
                </Button>
                <Button className="w-full" variant="outline">
                  Generate Report
                </Button>
                <Button className="w-full" variant="outline">
                  Export Data
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>App Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-slate-600">
                  <p>
                    <strong>Strava Roundup</strong> helps you visualize your fitness journey with beautiful analytics and insights.
                  </p>
                  <p>
                    Connect your Strava account and generate beautiful roundups of your workouts and breakthrough efforts—perfect for sharing or tracking your goals.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                      <span>Month by month miles and minutes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                      <span>Export-ready highlights</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                      <span>Read-only connection keeps data secure</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Navigation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/">
                  <Button className="w-full" variant="outline">
                    Back to Home
                  </Button>
                </Link>
                <Link to="/auth/callback">
                  <Button className="w-full" variant="outline">
                    Account Settings
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
