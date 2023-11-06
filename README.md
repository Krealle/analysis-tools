# Analysis tools

# Overview
### Prerequisites

- Node.js (v14.0 or newer)
- npm (v6.0 or newer)

### Installation

1. Clone this repository:

   ```bash
   git clone https://github.com/Krealle/analysis-tools.git
   ```
2. Install dependencies using npm:
   ```bash
   npm install
   ```
3. Change .env.local.example to .env.local and setup your Warcraft Logs client ID and client secret.
   ```
   VITE_WCL_CLIENT_ID=YOUR_CLIENT_ID
   VITE_WCL_CLIENT_SECRET=YOUR_CLIENT_SECRET
   ```
4. Start the application in local environment:
    ```bash
   npm run dev
   ```

### About
The goal of this tool is to provide more accurate damage attribution when playing with Augmentation. Due to the state of attribution hooks being all over the place, with either stealing too much or not firing at all.
The goal of this tool is to attempt to "normalize" the attributed amounts to show a more accurate representation of the actual values provided.

The way this is currently achieved is by linking up the current "source" events with their respective "support" events. If we find a mismatch between what we expected and what we got, eg. a BM Hunter casts Kill Command whilst having 4x Ebon Mights up, and we only get 1 support event, then we will fabricate the missing events.

This tool can then also be used to quickly figure out which spells have "broken" attribution, eg. BM Hunter pet abilities are currently in a very broken state where a lot of the damage won't be re-attributed.

### Notes
It is still early stages and the normalized damage might not be 100% correct and should be treated as a guideline, not definitive values.

Currently, stats are not being accounted for when calculating damage values, instead using fixed values. This inherently produces some form of inaccuracy. Due to Blizzard not providing proper stat events in the combat log, this becomes a complex issue to resolve accurately.

### Example
Here is an example of how the damage attributions currently shifts around for this log: https://www.warcraftlogs.com/reports/X2yBtArq6RbVkD1Z#fight=5&type=damage-done
![Down with Hunters!](https://github.com/Krealle/analysis-tools/assets/3404958/85424861-87b7-4d4e-9581-7d4525f806c8)
