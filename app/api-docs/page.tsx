"use client";

import { Header } from "@/components/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const apiEndpoints = [
  {
    method: "GET",
    path: "/api/restaurants",
    description: "Fetch all restaurants",
    sampleResponse: {
      restaurants: [
        {
          id: 1,
          name: "The Italian Corner",
          description: "Authentic Italian cuisine in a cozy atmosphere",
          address: "123 Main St, San Francisco, CA 94102",
          phone: "(415) 555-0101",
          email: "info@italiancorner.com",
          cuisine: "Italian",
          priceRange: "$$$",
        },
      ],
    },
  },
  {
    method: "GET",
    path: "/api/restaurants/:id",
    description: "Fetch a specific restaurant with opening hours and tables",
    sampleResponse: {
      restaurant: {
        id: 1,
        name: "The Italian Corner",
        cuisine: "Italian",
        priceRange: "$$$",
        openingHours: [
          { dayOfWeek: 0, openTime: "11:00", closeTime: "22:00", isClosed: false },
        ],
        tables: [
          { id: 1, tableNumber: "T1", capacity: 2 },
        ],
      },
    },
  },
  {
    method: "POST",
    path: "/api/bookings",
    description: "Create a new booking",
    sampleRequest: {
      restaurantId: 1,
      tableId: 1,
      customerName: "John Doe",
      customerEmail: "john@example.com",
      customerPhone: "(555) 123-4567",
      bookingDate: "2025-10-15",
      bookingTime: "19:00",
      partySize: 4,
      specialRequests: "Window seat please",
    },
    sampleResponse: {
      booking: {
        id: 4,
        restaurantId: 1,
        tableId: 1,
        customerId: 1,
        bookingDate: "2025-10-15",
        bookingTime: "19:00",
        partySize: 4,
        status: "confirmed",
      },
    },
  },
  {
    method: "GET",
    path: "/api/bookings",
    description: "Fetch all bookings or filter by customer email",
    queryParams: "?email=john@example.com (optional)",
    sampleResponse: {
      bookings: [
        {
          id: 1,
          bookingDate: "2025-10-10",
          bookingTime: "19:00",
          partySize: 4,
          status: "confirmed",
          restaurant: { name: "The Italian Corner", cuisine: "Italian" },
          table: { tableNumber: "T3", capacity: 4 },
          customer: { name: "John Doe", email: "john@example.com" },
        },
      ],
    },
  },
  {
    method: "GET",
    path: "/api/bookings/:id",
    description: "Get single booking details",
    sampleResponse: {
      booking: {
        id: 1,
        restaurant: { name: "The Italian Corner", cuisine: "Italian" },
        table: { tableNumber: "T1", capacity: 4 },
        customer: { name: "John Doe", email: "john@example.com" },
        bookingDate: "2025-10-15",
        bookingTime: "19:00",
        partySize: 4,
        specialRequests: "Window table preferred",
        status: "confirmed",
        createdAt: "2025-10-04T12:00:00Z",
      },
    },
  },
  {
    method: "PUT",
    path: "/api/bookings/:id",
    description: "Update booking details",
    sampleRequest: {
      customerName: "John Smith",
      customerEmail: "johnsmith@example.com",
      bookingDate: "2025-10-16",
      bookingTime: "20:00",
      partySize: 6,
      specialRequests: "Birthday celebration",
      tableId: 2,
    },
    sampleResponse: {
      booking: {
        id: 1,
        restaurantId: 1,
        tableId: 2,
        customerId: 1,
        bookingDate: "2025-10-16",
        bookingTime: "20:00",
        partySize: 6,
        specialRequests: "Birthday celebration",
        status: "confirmed",
        createdAt: "2025-10-04T12:00:00Z",
      },
    },
  },
  {
    method: "DELETE",
    path: "/api/bookings/:id",
    description: "Cancel a booking",
    sampleResponse: {
      booking: {
        id: 1,
        restaurantId: 1,
        tableId: 1,
        customerId: 1,
        bookingDate: "2025-10-15",
        bookingTime: "19:00",
        partySize: 4,
        specialRequests: "Window table preferred",
        status: "cancelled",
        createdAt: "2025-10-04T12:00:00Z",
      },
      message: "Booking cancelled successfully",
    },
  },
  {
    method: "PATCH",
    path: "/api/bookings/:id/status",
    description: "Update booking status",
    sampleRequest: {
      status: "completed",
    },
    sampleResponse: {
      booking: {
        id: 1,
        status: "completed",
      },
      message: "Booking status updated to completed",
    },
  },
  {
    method: "GET",
    path: "/api/bookings/search",
    description: "Search bookings with filters",
    queryParams: "?restaurantId=1&status=confirmed&dateFrom=2025-10-01&limit=50",
    sampleResponse: {
      bookings: [
        {
          id: 1,
          restaurant: { name: "The Italian Corner" },
          customer: { name: "John Doe", email: "john@example.com" },
          bookingDate: "2025-10-15",
          bookingTime: "19:00",
          status: "confirmed",
        },
      ],
      total: 1,
      limit: 50,
      offset: 0,
      hasMore: false,
    },
  },
  {
    method: "PATCH",
    path: "/api/bookings/bulk",
    description: "Bulk update booking statuses",
    sampleRequest: {
      bookingIds: [1, 2, 3],
      status: "completed",
    },
    sampleResponse: {
      message: "Successfully updated 3 bookings",
      updatedCount: 3,
      bookings: [
        { id: 1, status: "completed" },
        { id: 2, status: "completed" },
        { id: 3, status: "completed" },
      ],
    },
  },
  {
    method: "DELETE",
    path: "/api/bookings/bulk",
    description: "Bulk cancel bookings",
    sampleRequest: {
      bookingIds: [1, 2, 3],
    },
    sampleResponse: {
      message: "Successfully cancelled 3 bookings",
      cancelledCount: 3,
      bookings: [
        { id: 1, status: "cancelled" },
        { id: 2, status: "cancelled" },
        { id: 3, status: "cancelled" },
      ],
    },
  },
];

export default function ApiDocsPage() {
  return (
    <>
      <Header />
      <div className="mx-auto p-6 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">API Documentation</h1>
          <p className="text-muted-foreground">
            FreeTable REST API endpoints for restaurant booking management
          </p>
        </div>

        <div className="space-y-6">
          {apiEndpoints.map((endpoint, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={endpoint.method === "GET" ? "secondary" : "default"}
                    className={
                      endpoint.method === "GET"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                        : "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                    }
                  >
                    {endpoint.method}
                  </Badge>
                  <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                    {endpoint.path}
                  </code>
                </div>
                <CardDescription className="mt-2">
                  {endpoint.description}
                  {endpoint.queryParams && (
                    <div className="mt-1">
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {endpoint.queryParams}
                      </code>
                    </div>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="response" className="w-full">
                  <TabsList>
                    {endpoint.sampleRequest && <TabsTrigger value="request">Request</TabsTrigger>}
                    <TabsTrigger value="response">Response</TabsTrigger>
                  </TabsList>
                  {endpoint.sampleRequest && (
                    <TabsContent value="request">
                      <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">
                        <code>{JSON.stringify(endpoint.sampleRequest, null, 2)}</code>
                      </pre>
                    </TabsContent>
                  )}
                  <TabsContent value="response">
                    <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">
                      <code>{JSON.stringify(endpoint.sampleResponse, null, 2)}</code>
                    </pre>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}

