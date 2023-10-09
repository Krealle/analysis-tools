export const getReportQuery = `
query getReport($reportID: String!) {
  reportData {
    report(code: $reportID) {
      title
      startTime
      endTime
      region {
        slug
      }
      fights(translate: true) {
        id
        startTime
        endTime
        keystoneLevel
        keystoneAffixes
        keystoneBonus
        keystoneTime
        rating
        averageItemLevel
        friendlyPlayers
        gameZone {
          id
        }
      }
    }
  }
}
`;

export const getFightsQuery = `
query getReport($reportID: String!) {
  reportData {
    report(code: $reportID) {
      title
      fights(translate: true) {
        id
        startTime
        endTime
        gameZone {
          id
        }
        name
        difficulty
        kill
      }
    }
  }
}
`;

export const getEventsQuery = `
  query getEvents(
    $reportID: String!
    $startTime: Float!
    $endTime: Float!
    $limit: Int
    $filterExpression: String
  ) {
    reportData {
      report(code: $reportID) {
        events(
          startTime: $startTime
          endTime: $endTime
          limit: $limit
          filterExpression: $filterExpression
        ) {
          data
          nextPageTimestamp
        }
      }
    }
  }`;

export const getTableQuery = ` query getTable(
    $reportID: String!
    $fightIDs: [Int]!
    $startTime: Float!
    $endTime: Float!
  ) {
    reportData {
      report(code: $reportID) {
        table(startTime: $startTime, endTime: $endTime, fightIDs: $fightIDs)
      }
    }
  }`;
