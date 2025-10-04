"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/header";

type Restaurant = {
  id: number;
  name: string;
  description: string;
  cuisine: string;
  priceRange: string;
  address: string;
  phone: string;
};

type OpeningHours = {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
};

type RestaurantWithDetails = Restaurant & {
  openingHours: OpeningHours[];
  tables: { id: number; tableNumber: string; capacity: number; isActive: boolean }[];
};

export default function Home() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<RestaurantWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingData, setBookingData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    bookingDate: "",
    bookingTime: "",
    partySize: "",
    specialRequests: "",
  });
  const [bookingStatus, setBookingStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const response = await fetch("/api/restaurants");
      const data = await response.json() as { restaurants: Restaurant[] };
      setRestaurants(data.restaurants);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      setLoading(false);
    }
  };

  const fetchRestaurantDetails = async (id: number) => {
    try {
      const response = await fetch(`/api/restaurants/${id}`);
      const data = await response.json() as { restaurant: RestaurantWithDetails };
      setSelectedRestaurant(data.restaurant);
    } catch (error) {
      console.error("Error fetching restaurant details:", error);
    }
  };

  const handleRestaurantSelect = (restaurantId: string) => {
    const id = parseInt(restaurantId);
    fetchRestaurantDetails(id);
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingStatus({ type: null, message: "" });

    if (!selectedRestaurant) return;

    // Frontend validation: Check if date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(bookingData.bookingDate);
    
    if (selectedDate < today) {
      setBookingStatus({
        type: "error",
        message: "Cannot book in the past. Please select today or a future date.",
      });
      return;
    }

    // Frontend validation: Check if restaurant is open on selected day
    const dayOfWeek = selectedDate.getDay();
    const hoursForDay = selectedRestaurant.openingHours.find(
      (h) => h.dayOfWeek === dayOfWeek
    );

    if (hoursForDay?.isClosed) {
      setBookingStatus({
        type: "error",
        message: "Restaurant is closed on this day. Please select another date.",
      });
      return;
    }

    // Frontend validation: Email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(bookingData.customerEmail)) {
      setBookingStatus({
        type: "error",
        message: "Please enter a valid email address.",
      });
      return;
    }

    // Frontend validation: Phone format (basic check)
    if (bookingData.customerPhone.length < 10) {
      setBookingStatus({
        type: "error",
        message: "Please enter a valid phone number.",
      });
      return;
    }

    // Find available table
    const table = selectedRestaurant.tables.find(
      (t) => t.capacity >= parseInt(bookingData.partySize) && t.isActive
    );

    if (!table) {
      setBookingStatus({
        type: "error",
        message: "No available tables for this party size",
      });
      return;
    }

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: selectedRestaurant.id,
          tableId: table.id,
          ...bookingData,
          partySize: parseInt(bookingData.partySize),
        }),
      });

      const data = await response.json() as { booking?: unknown; error?: string };

      if (response.ok) {
        setBookingStatus({
          type: "success",
          message: "Booking confirmed! We look forward to seeing you.",
        });
        setBookingData({
          customerName: "",
          customerEmail: "",
          customerPhone: "",
          bookingDate: "",
          bookingTime: "",
          partySize: "",
          specialRequests: "",
        });
      } else {
        setBookingStatus({
          type: "error",
          message: data.error || "Failed to create booking",
        });
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      setBookingStatus({
        type: "error",
        message: "An error occurred. Please try again.",
      });
    }
  };

  const getDayName = (day: number) => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[day];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="mx-auto p-6 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Find Your Perfect Table</h1>
          <p className="text-muted-foreground text-lg">
            Discover amazing restaurants and book your next dining experience
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
        {/* Restaurants List */}
        <div className="space-y-4">
          {restaurants.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No restaurants available</p>
              </CardContent>
            </Card>
          ) : (
            restaurants.map((restaurant) => (
              <Card
                key={restaurant.id}
                className={`cursor-pointer hover:border-primary transition-colors ${
                  selectedRestaurant?.id === restaurant.id
                    ? "border-primary border-2"
                    : ""
                }`}
                onClick={() => handleRestaurantSelect(restaurant.id.toString())}
              >
                <CardHeader>
                  <CardTitle>{restaurant.name}</CardTitle>
                  <CardDescription>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary">{restaurant.cuisine}</Badge>
                      <Badge variant="outline">{restaurant.priceRange}</Badge>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    {restaurant.description}
                  </p>
                  <p className="text-xs text-muted-foreground">{restaurant.address}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Booking Form */}
        <div>
          {selectedRestaurant ? (
            <Card>
              <CardHeader>
                <CardTitle>{selectedRestaurant.name}</CardTitle>
                <CardDescription>Make a reservation</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Opening Hours */}
                <div className="mb-6 p-3 border rounded-md">
                  <p className="text-sm font-medium mb-2">Opening Hours</p>
                  <div className="text-xs space-y-1">
                    {selectedRestaurant.openingHours
                      .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                      .map((hours) => (
                        <div key={hours.dayOfWeek} className="flex justify-between">
                          <span>{getDayName(hours.dayOfWeek).slice(0, 3)}</span>
                          <span>
                            {hours.isClosed
                              ? "Closed"
                              : `${hours.openTime}-${hours.closeTime}`}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="customerName" className="mb-2 block">Name</Label>
                    <Input
                      id="customerName"
                      required
                      placeholder="John Doe"
                      minLength={2}
                      value={bookingData.customerName}
                      onChange={(e) =>
                        setBookingData({
                          ...bookingData,
                          customerName: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="customerEmail" className="mb-2 block">Email</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      required
                      placeholder="your@email.com"
                      value={bookingData.customerEmail}
                      onChange={(e) =>
                        setBookingData({
                          ...bookingData,
                          customerEmail: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="customerPhone" className="mb-2 block">Phone</Label>
                    <Input
                      id="customerPhone"
                      type="tel"
                      required
                      placeholder="(555) 123-4567"
                      minLength={10}
                      value={bookingData.customerPhone}
                      onChange={(e) =>
                        setBookingData({
                          ...bookingData,
                          customerPhone: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bookingDate" className="mb-2 block">Date</Label>
                      <Input
                        id="bookingDate"
                        type="date"
                        required
                        min={new Date().toISOString().split("T")[0]}
                        max={new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
                        value={bookingData.bookingDate}
                        onChange={(e) =>
                          setBookingData({
                            ...bookingData,
                            bookingDate: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="bookingTime" className="mb-2 block">Time</Label>
                      <Input
                        id="bookingTime"
                        type="time"
                        required
                        value={bookingData.bookingTime}
                        onChange={(e) =>
                          setBookingData({
                            ...bookingData,
                            bookingTime: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="partySize" className="mb-2 block">Party Size</Label>
                    <Select
                      value={bookingData.partySize}
                      onValueChange={(value) =>
                        setBookingData({ ...bookingData, partySize: value })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((size) => (
                          <SelectItem key={size} value={size.toString()}>
                            {size} {size === 1 ? "guest" : "guests"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="specialRequests" className="mb-2 block">Special Requests (Optional)</Label>
                    <Textarea
                      id="specialRequests"
                      value={bookingData.specialRequests}
                      onChange={(e) =>
                        setBookingData({
                          ...bookingData,
                          specialRequests: e.target.value,
                        })
                      }
                      placeholder="Any special requirements..."
                    />
                  </div>

                  {bookingStatus.type && (
                    <div
                      className={`p-3 rounded-md text-sm ${
                        bookingStatus.type === "success"
                          ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                          : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                      }`}
                    >
                      {bookingStatus.message}
                    </div>
                  )}

                  <Button type="submit" className="w-full cursor-pointer">
                    Confirm Booking
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <CardDescription>Select a restaurant to book a table</CardDescription>
              </CardContent>
            </Card>
          )}
        </div>
        </div>
      </div>
    </>
  );
}
