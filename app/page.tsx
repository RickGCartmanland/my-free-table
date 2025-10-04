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
  tables: { id: number; tableNumber: string; capacity: number }[];
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

    // Find available table
    const table = selectedRestaurant.tables.find(
      (t) => t.capacity >= parseInt(bookingData.partySize)
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
        <p className="text-lg">Loading restaurants...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2">FreeTable</h1>
          <p className="text-muted-foreground">
            Book your perfect dining experience
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Restaurants List */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Available Restaurants</CardTitle>
                <CardDescription>
                  Select a restaurant to make a booking
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {restaurants.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No restaurants available. Please add some sample data.
                  </p>
                ) : (
                  restaurants.map((restaurant) => (
                    <Card
                      key={restaurant.id}
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() =>
                        handleRestaurantSelect(restaurant.id.toString())
                      }
                    >
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {restaurant.name}
                        </CardTitle>
                        <CardDescription>
                          {restaurant.cuisine} • {restaurant.priceRange}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{restaurant.description}</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          {restaurant.address}
                        </p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Booking Form */}
          <div>
            {selectedRestaurant ? (
              <Card>
                <CardHeader>
                  <CardTitle>Book at {selectedRestaurant.name}</CardTitle>
                  <CardDescription>
                    Fill in your details to make a reservation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Opening Hours */}
                  <div className="mb-6 p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold mb-2">Opening Hours:</h3>
                    <div className="text-sm space-y-1">
                      {selectedRestaurant.openingHours
                        .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                        .map((hours) => (
                          <div key={hours.dayOfWeek} className="flex justify-between">
                            <span>{getDayName(hours.dayOfWeek)}</span>
                            <span>
                              {hours.isClosed
                                ? "Closed"
                                : `${hours.openTime} - ${hours.closeTime}`}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>

                  <form onSubmit={handleBookingSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="customerName">Name</Label>
                      <Input
                        id="customerName"
                        required
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
                      <Label htmlFor="customerEmail">Email</Label>
                      <Input
                        id="customerEmail"
                        type="email"
                        required
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
                      <Label htmlFor="customerPhone">Phone</Label>
                      <Input
                        id="customerPhone"
                        type="tel"
                        required
                        value={bookingData.customerPhone}
                        onChange={(e) =>
                          setBookingData({
                            ...bookingData,
                            customerPhone: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="bookingDate">Date</Label>
                      <Input
                        id="bookingDate"
                        type="date"
                        required
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
                      <Label htmlFor="bookingTime">Time</Label>
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

                    <div>
                      <Label htmlFor="partySize">Party Size</Label>
                      <Select
                        value={bookingData.partySize}
                        onValueChange={(value) =>
                          setBookingData({ ...bookingData, partySize: value })
                        }
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select party size" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((size) => (
                            <SelectItem key={size} value={size.toString()}>
                              {size} {size === 1 ? "person" : "people"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="specialRequests">
                        Special Requests (Optional)
                      </Label>
                      <Textarea
                        id="specialRequests"
                        value={bookingData.specialRequests}
                        onChange={(e) =>
                          setBookingData({
                            ...bookingData,
                            specialRequests: e.target.value,
                          })
                        }
                        placeholder="Any dietary requirements or special occasions?"
                      />
                    </div>

                    {bookingStatus.type && (
                      <div
                        className={`p-4 rounded-lg ${
                          bookingStatus.type === "success"
                            ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                            : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                        }`}
                      >
                        {bookingStatus.message}
                      </div>
                    )}

                    <Button type="submit" className="w-full">
                      Confirm Booking
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Select a Restaurant</CardTitle>
                  <CardDescription>
                    Choose a restaurant from the list to start booking
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Click on any restaurant card to view details and make a
                    reservation.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
