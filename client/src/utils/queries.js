import { gql } from '@apollo/client'

export const QUERY_ME = gql`
  query me {
    me {
      _id
      username
      email
      savedBooks {
        bookId
        authors
        description
        image
        link
        title
      }
    }
  }
`

export const SEARCH_GOOGLE_BOOKS = gql`
  query searchGoogleBooks($query: String!) {
    searchGoogleBooks(query: $query) {
      bookId
      authors
      description
      image
      link
      title
    }
  }
`
