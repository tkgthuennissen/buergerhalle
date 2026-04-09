#!/bin/bash

# In den Subpages brauchen wir relative Pfade
# Links zwischen Subpages: z.B. addresses.html (nicht pages/addresses.html)
# Links zur Startseite: ../index.html

for file in *.html; do
  # Ändere pages/addresses.html zu addresses.html etc.
  sed -i 's|href="pages/addresses.html"|href="addresses.html"|g' "$file"
  sed -i 's|href="pages/articles.html"|href="articles.html"|g' "$file"
  sed -i 's|href="pages/calendar.html"|href="calendar.html"|g' "$file"
  sed -i 's|href="pages/bookings.html"|href="bookings.html"|g' "$file"
  sed -i 's|href="pages/booking-form.html"|href="booking-form.html"|g' "$file"
  sed -i 's|href="pages/documents.html"|href="documents.html"|g' "$file"
  sed -i 's|href="pages/invoices.html"|href="invoices.html"|g' "$file"
  sed -i 's|href="pages/cashbook.html"|href="cashbook.html"|g' "$file"
  
  # Ändere Home-Link von index.html zu ../index.html
  sed -i 's|href="index.html"|href="../index.html"|g' "$file"
done

echo "Links fixed in all subpages"
