const { chromium } = require('playwright');
const fs = require('fs').promises;

async function scrapeCalendar() {
  const browser = await chromium.launch({
    headless: true
  });

  const page = await browser.newPage();

  try {
    console.log('Navigating to the calendar page...');
    await page.goto('https://www.oregon.gov/odhs/engagement/Pages/odds-engagement.aspx#calendar', {
      waitUntil: 'networkidle'
    });

    // Wait for the calendar to load
    console.log('Waiting for calendar to load...');
    await page.waitForTimeout(3000);

    // Try to find calendar events - this page likely has a calendar widget
    // Let's check for common calendar selectors
    console.log('Looking for calendar events...');

    // Get all event elements and their details
    const events = await page.evaluate(() => {
      const eventsList = [];

      // Look for table rows in the calendar
      const tables = document.querySelectorAll('table');

      for (const table of tables) {
        const rows = table.querySelectorAll('tbody tr');

        // Check if this looks like a calendar table by looking at the headers
        const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent.trim().toLowerCase());
        const hasEventHeaders = headers.some(h =>
          h.includes('event') || h.includes('date') || h.includes('time') || h.includes('description')
        );

        if (hasEventHeaders || rows.length > 0) {
          rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 2) {
              // Try to extract structured data from table cells
              const cellData = Array.from(cells).map(cell => cell.textContent.trim());

              // Common pattern: Date/Time, Event Name, Description, Link/How to join
              const event = {
                rawCellData: cellData,
                dateTime: cellData[0] || '',
                eventName: cellData[1] || '',
                description: cellData[2] || '',
                joinInfo: cellData[3] || '',
                links: []
              };

              // Extract any links from the row
              const links = row.querySelectorAll('a');
              links.forEach(link => {
                event.links.push({
                  text: link.textContent.trim(),
                  href: link.href
                });
              });

              // Only add if it has substantive data
              if (event.dateTime || event.eventName) {
                eventsList.push(event);
              }
            }
          });
        }
      }

      // Also look for calendar list items
      const listItems = document.querySelectorAll('.ms-acal-item, .calendar-item, .event-item');
      listItems.forEach(item => {
        eventsList.push({
          type: 'list-item',
          content: item.textContent.trim(),
          html: item.innerHTML
        });
      });

      return eventsList;
    });

    console.log(`Found ${events.length} events`);

    // If we found events with links, visit each one to get more details
    const detailedEvents = [];

    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      console.log(`Processing event ${i + 1}/${events.length}: ${event.eventName || event.type || 'Unknown event'}`);

      const detailedEvent = {
        ...event,
        additionalInfo: null
      };

      // If the event has links, visit them to get more details
      if (event.links && event.links.length > 0) {
        const linkDetails = [];

        for (const link of event.links) {
          if (link.href && link.href.startsWith('http')) {
            try {
              const detailPage = await browser.newPage();
              await detailPage.goto(link.href, { waitUntil: 'networkidle', timeout: 30000 });
              await detailPage.waitForTimeout(1000);

              // Extract detailed information from the linked page
              const details = await detailPage.evaluate(() => {
                return {
                  pageTitle: document.title || '',
                  metaDescription: document.querySelector('meta[name="description"]')?.content || '',
                  mainContent: document.querySelector('main, article, .content, #content')?.innerText || document.body?.innerText?.substring(0, 5000) || ''
                };
              });

              linkDetails.push({
                linkText: link.text,
                linkHref: link.href,
                details: details
              });

              await detailPage.close();
            } catch (error) {
              console.log(`Error loading details for link: ${link.text} - ${error.message}`);
              linkDetails.push({
                linkText: link.text,
                linkHref: link.href,
                error: error.message
              });
            }
          }
        }

        if (linkDetails.length > 0) {
          detailedEvent.additionalInfo = linkDetails;
        }
      }

      detailedEvents.push(detailedEvent);
    }

    // Save the results
    const outputData = {
      scrapedAt: new Date().toISOString(),
      sourceUrl: 'https://www.oregon.gov/odhs/engagement/Pages/odds-engagement.aspx#calendar',
      totalEvents: detailedEvents.length,
      events: detailedEvents
    };

    await fs.writeFile('calendar-events.json', JSON.stringify(outputData, null, 2));
    console.log('\nResults saved to calendar-events.json');
    console.log(`Total events scraped: ${detailedEvents.length}`);

  } catch (error) {
    console.error('Error scraping calendar:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

scrapeCalendar().catch(console.error);
