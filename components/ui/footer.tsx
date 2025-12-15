"use client";

import Link from "next/link";
import { MessageCircle, MapPin, Phone, Mail } from "lucide-react";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t bg-white lg:ml-64">
      <div className="container mx-auto px-4 py-4">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-6">
          {/* Logo & Description */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <Image 
              src="/logo.png" 
              alt="FeeAdmin" 
              width={120} 
              height={40} 
              className="h-8 w-auto"
            />
            <p className="text-sm text-muted-foreground text-center md:text-left max-w-xs">
              Complete solution for managing students, fees, staff, and attendance.
            </p>
          </div>

          {/* Address */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <h3 className="font-semibold text-sm">Address</h3>
            <div className="text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="text-left">
                  Pal Nagar, Kachwa Road,<br />
                  Karnal, Haryana (India)
                </span>
              </div>
            </div>
          </div>

          {/* Contact (Email + Phone) */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <h3 className="font-semibold text-sm">Contact</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <a
                href="https://wa.me/919518233053"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-primary transition-colors"
              >
                <Phone className="w-4 h-4" />
                +91 95182 33053
              </a>
              <a
                href="mailto:mohinderpunia82@gmail.com"
                className="flex items-center gap-2 hover:text-primary transition-colors"
              >
                <Mail className="w-4 h-4" />
                mohinderpunia82@gmail.com
              </a>
            </div>
          </div>

          {/* Developed By Section */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <h3 className="font-semibold text-sm">Developed By</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <a
                href="https://wa.me/917541004076"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors block"
              >
                Scale Edge Digital
              </a>
              <a
                href="https://wa.me/918318683717"
                target="_blank"
                rel="noopener noreferrer"
                className="flex text-xs items-center gap-2 hover:text-primary transition-colors"
              >
                (Aryan Chaturvedi)
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
