import React, { useState, useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { supabase } from "@/integrations/supabase/client";
import { CalendarEvent } from "./bookings/components/CalendarEvent";
import { CustomerSearch } from "./bookings/components/CustomerSearch";
import { ServiceSelector } from "./bookings/components/ServiceSelector";
import { CalendarIcon, ArrowLeftIcon, ArrowRightIcon } from "./bookings/components/Icons";
import type { Customer } from "./bookings/types";

// Configuration
const START_HOUR = 8; // 8:00 AM
const END_HOUR = 20; // 8:00 PM
const TOTAL_HOURS = END_HOUR - START_HOUR;
const PIXELS_PER_HOUR = 60;

// Format a fractional hour as "h:mmam/pm"
function formatTime(time: number) {
  const hours = Math.floor(time);
  const minutes = Math.round((time - hours) * 60);
  const period = hours >= 12 ? "pm" : "am";
  let displayHour = hours % 12;
  if (displayHour === 0) displayHour = 12;
  return `${displayHour}:${minutes.toString().padStart(2, "0")}${period}`;
}

// For the left column: integer hours only (8..19) => 12 hours
const hourLabels = Array.from({ length: 12 }, (_, i) => i + START_HOUR);

// Sample events
const initialEvents = [
  { id: 1, employeeId: 1, title: "Haircut", startHour: 9, duration: 1 },
  { id: 2, employeeId: 2, title: "Facial", startHour: 9.5, duration: 1.5 },
  { id: 3, employeeId: 3, title: "Manicure", startHour: 13, duration: 1 },
];

// Example stats
const initialStats = [
  { label: "Pending Confirmation", value: 0 },
  { label: "Upcoming Bookings", value: 11 },
  { label: "Today's Bookings", value: 5 },
  { label: "Today's Revenue", value: 1950 },
];

export default function AdminBookings() {
  const [employees, setEmployees] = useState([]);
  const [events, setEvents] = useState(initialEvents);
  const [stats] = useState(initialStats);
  const [currentDate, setCurrentDate] = useState(new Date(2025, 1, 11));
  const [nowPosition, setNowPosition] = useState<number | null>(null);
  const [clickedCell, setClickedCell] = useState<any>(null);
  const [isAddAppointmentOpen, setIsAddAppointmentOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Update now line
  useEffect(() => {
    const updateNow = () => {
      const now = new Date();
      const currentHour = now.getHours() + now.getMinutes() / 60;
      if (currentHour >= START_HOUR && currentHour <= END_HOUR) {
        setNowPosition((currentHour - START_HOUR) * PIXELS_PER_HOUR);
      } else {
        setNowPosition(null);
      }
    };
    updateNow();
    const intervalId = setInterval(updateNow, 60000);
    return () => clearInterval(intervalId);
  }, []);

  // Fetch employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const { data, error } = await supabase.from("employees").select("*");
        if (error) throw error;
        const employeeWithAvatar = data.map((employee) => ({
          ...employee,
          avatar: employee.name
            .split(" ")
            .map((n) => n[0])
            .join(""),
        }));
        setEmployees(employeeWithAvatar);
      } catch (error) {
        console.error("Error fetching employees:", error);
        setEmployees([]);
      }
    };

    fetchEmployees();
  }, []);

  // Format the displayed date as "Tue 11 Feb"
  function formatCurrentDate(date: Date) {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dayOfWeek = days[date.getDay()];
    const dayOfMonth = date.getDate();
    const month = months[date.getMonth()];
    return `${dayOfWeek} ${dayOfMonth} ${month}`;
  }

  const handleEventUpdate = (eventId: number, changes: any) => {
    setEvents((prev) =>
      prev.map((ev) => (ev.id === eventId ? { ...ev, ...changes } : ev))
    );
  };

  // Navigation functions
  const goToday = () => setCurrentDate(new Date());
  const goPrev = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };
  const goNext = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  // Column click handling
  function handleColumnClick(e: React.MouseEvent, empId: number) {
    if (e.target !== e.currentTarget) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    let clickedTime = START_HOUR + offsetY / PIXELS_PER_HOUR;
    clickedTime = Math.round(clickedTime * 4) / 4;

    setClickedCell({
      employeeId: empId,
      time: clickedTime,
      x: e.pageX + 10,
      y: e.pageY - 20,
    });
  }

  const openAddAppointment = () => {
    setIsAddAppointmentOpen(true);
    setClickedCell(null);
  };

  const closeAddAppointment = () => {
    setIsAddAppointmentOpen(false);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col h-screen bg-gray-50 relative">
        {/* Header */}
        <header className="p-4 border-b bg-white flex justify-between items-center">
          <div className="font-bold text-xl">Define Salon</div>
        </header>

        {/* Stats */}
        <div className="p-4 border-b bg-white flex space-x-4 overflow-x-auto">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white border rounded shadow-sm px-4 py-2 min-w-[150px]"
            >
              <div className="text-gray-500 text-sm">{stat.label}</div>
              <div className="text-xl font-bold">
                {stat.label === "Today's Revenue" ? `$${stat.value}` : stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Date Navigation */}
        <div className="p-4 border-b bg-white flex items-center space-x-2">
          <button
            onClick={goToday}
            className="px-4 py-1 border rounded-full hover:bg-gray-100 text-sm"
          >
            Today
          </button>
          <button
            onClick={goPrev}
            className="px-3 py-1 border rounded-full hover:bg-gray-100 flex items-center justify-center"
          >
            <ArrowLeftIcon />
          </button>
          <div className="px-6 py-1 border rounded-full text-sm flex items-center justify-center">
            {formatCurrentDate(currentDate)}
          </div>
          <button
            onClick={goNext}
            className="px-3 py-1 border rounded-full hover:bg-gray-100 flex items-center justify-center"
          >
            <ArrowRightIcon />
          </button>
        </div>

        {/* Employee Header */}
        <div className="flex border-b bg-white">
          <div className="w-16 border-r" />
          {employees.map((emp: any) => (
            <div
              key={emp.id}
              className="flex-1 border-r flex items-center justify-center p-2"
            >
              <div className="flex flex-col items-center space-y-1">
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center font-bold text-white">
                  {emp.avatar}
                </div>
                <div className="text-xs font-medium text-gray-700">{emp.name}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Schedule Grid */}
        <div className="flex-1 overflow-auto">
          <div className="flex">
            {/* Hours Column */}
            <div className="w-16 border-r">
              {hourLabels.map((hr) => (
                <div
                  key={hr}
                  className="h-[60px] flex items-center justify-end pr-1 text-[10px] text-gray-700 font-bold border-b"
                >
                  {formatTime(hr)}
                </div>
              ))}
            </div>

            {/* Employee Columns */}
            {employees.map((emp: any) => (
              <div
                key={emp.id}
                className="flex-1 border-r relative"
                style={{
                  minWidth: "150px",
                  height: TOTAL_HOURS * PIXELS_PER_HOUR,
                }}
                onClick={(e) => handleColumnClick(e, emp.id)}
              >
                {/* Background Grid */}
                {Array.from({ length: TOTAL_HOURS * 4 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="absolute left-0 right-0 border-b"
                    style={{ top: idx * 15 }}
                  />
                ))}

                {/* Now Line */}
                {nowPosition !== null && (
                  <div
                    className="absolute left-0 right-0 h-[2px] bg-red-500"
                    style={{ top: nowPosition }}
                  />
                )}

                {/* Events */}
                {events
                  .filter((ev) => ev.employeeId === emp.id)
                  .map((evt) => (
                    <CalendarEvent
                      key={evt.id}
                      event={evt}
                      onEventUpdate={handleEventUpdate}
                    />
                  ))}
              </div>
            ))}
          </div>
        </div>

        {/* Clicked Cell Popup */}
        {clickedCell && (
          <div
            className="fixed z-50 w-48 rounded-lg shadow-lg border border-gray-200 overflow-hidden"
            style={{
              left: clickedCell.x,
              top: clickedCell.y,
            }}
          >
            <div className="bg-black px-4 py-2 text-sm font-medium text-white">
              {formatTime(clickedCell.time)}
            </div>
            <div
              className="bg-white px-4 py-3 flex items-center space-x-3 text-sm cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={openAddAppointment}
            >
              <CalendarIcon className="h-4 w-4 text-gray-600" />
              <span className="text-gray-700">Add Appointment</span>
            </div>
          </div>
        )}

        {/* Add Appointment Slide-in */}
        <div
          className={`fixed top-0 right-0 w-full max-w-6xl h-full bg-white z-50 transform transition-transform duration-300 ease-in-out shadow-xl ${
            isAddAppointmentOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="h-full flex flex-col">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">New Appointment</h2>
                <button
                  onClick={closeAddAppointment}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              {clickedCell && (
                <p className="text-sm text-muted-foreground mt-1">
                  {format(currentDate, "MMMM d, yyyy")} at {formatTime(clickedCell.time)}
                </p>
              )}
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Customer Selection Panel - 40% */}
              <div className="w-[40%] border-r overflow-y-auto p-6">
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">Select Customer</h3>
                  {!selectedCustomer ? (
                    <CustomerSearch onSelect={(customer) => {
                      setSelectedCustomer(customer);
                      setShowCreateForm(false);
                    }} />
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{selectedCustomer.full_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {selectedCustomer.email}
                          </p>
                        </div>
                        <button
                          className="text-sm text-gray-600 hover:text-gray-900"
                          onClick={() => setSelectedCustomer(null)}
                        >
                          Change Customer
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Services Selection Panel - 60% */}
              <div className="w-[60%] overflow-y-auto p-6">
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">Select Services</h3>
                  <ServiceSelector
                    onServiceSelect={(serviceId) => {
                      // TODO: Implement service selection
                      console.log('Service selected:', serviceId);
                    }}
                    onPackageSelect={(packageId, services) => {
                      // TODO: Implement package selection
                      console.log('Package selected:', packageId, services);
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="border-t p-6">
              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={closeAddAppointment}
                >
                  Cancel
                </Button>
                <Button>
                  Create Appointment
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Backdrop */}
        {isAddAppointmentOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={closeAddAppointment}
          />
        )}
      </div>
    </DndProvider>
  );
}
