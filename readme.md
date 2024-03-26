# graphstate

A reactive GraphQL client generator.

Work in progress.

Initial values for types:

```gql
# Type            | Initial value
String            # null
String!           # ""
Int!              # 0
Float!            # 0
Boolean!          # false
ID!               # "" ?????
[String!]!        # []

type Link {       # {
  title: String!  #   title: "",
  url:   String!  #   url:   "",
}                 # }

enum LinkState {  # "None" (always the first member)
  None
  Bookmark
  InProgress
  Completed
}

union LinkUnion = LinkState | Link

LinkUnion         # null
LinkUnion!        # "None" (LinkState is the first member of the union)
```