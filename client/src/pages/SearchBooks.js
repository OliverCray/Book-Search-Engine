import React, { useState, useEffect } from 'react'
import { Container, Col, Form, Button, Card, Row } from 'react-bootstrap'

import { useMutation, useQuery } from '@apollo/client'
import { SAVE_BOOK } from '../utils/mutations'
import { SEARCH_GOOGLE_BOOKS } from '../utils/queries'

import Auth from '../utils/auth'
import { saveBookIds, getSavedBookIds } from '../utils/localStorage'

const SearchBooks = () => {
  // create state for holding returned google api data
  const [searchedBooks, setSearchedBooks] = useState([])
  // create state for holding our search field data
  const [searchInput, setSearchInput] = useState('')

  // create state to hold saved bookId values
  const [savedBookIds, setSavedBookIds] = useState(getSavedBookIds())

  const [saveBook] = useMutation(SAVE_BOOK)

  // Use the useQuery hook to fetch data from the GraphQL server
  const { loading, data } = useQuery(SEARCH_GOOGLE_BOOKS, {
    variables: { query: searchInput }, // Pass the search query as a variable
  })

  // This displays new book results any time the searchInput changes
  // This is okay to use here because the google books API is free, however, if we were to use a paid API this would be a bad practice because it would cost money to make this many calls to the API
  useEffect(() => {
    if (data) {
      // Set searchedBooks when data is available
      setSearchedBooks(data.searchGoogleBooks)
    }
  }, [data])

  // set up useEffect hook to save `savedBookIds` list to localStorage on component unmount
  // learn more here: https://reactjs.org/docs/hooks-effect.html#effects-with-cleanup
  useEffect(() => {
    return () => saveBookIds(savedBookIds)
  }, [savedBookIds])

  // create method to search for books and set state on form submit
  const handleFormSubmit = async (event) => {
    event.preventDefault()

    if (!searchInput) {
      return false
    }

    try {
      // Use the data variable from the useQuery hook
      const bookData = data.searchGoogleBooks

      setSearchedBooks(bookData)
      setSearchInput('')
    } catch (err) {
      console.error(err)
    }
  }

  // create function to handle saving a book to our database
  const handleSaveBook = async (bookId) => {
    // find the book in `searchedBooks` state by the matching id
    const bookToSave = searchedBooks.find((book) => book.bookId === bookId)

    // get token
    const token = Auth.loggedIn() ? Auth.getToken() : null

    if (!token) {
      return false
    }

    try {
      const { data } = await saveBook({
        variables: {
          bookData: {
            authors: bookToSave.authors,
            description: bookToSave.description,
            title: bookToSave.title,
            bookId: bookToSave.bookId,
            image: bookToSave.image,
            link: bookToSave.link,
          },
        },
      })

      // if book successfully saves to user's account, save book id to state
      setSavedBookIds([...savedBookIds, bookToSave.bookId])
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <>
      <div className="text-light bg-dark p-5">
        <Container>
          <h1>Search for Books!</h1>
          <Form onSubmit={handleFormSubmit}>
            <Row>
              <Col xs={12} md={8}>
                <Form.Control
                  name="searchInput"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  type="text"
                  size="lg"
                  placeholder="Search for a book"
                />
              </Col>
              <Col xs={12} md={4}>
                <Button type="submit" variant="success" size="lg">
                  Submit Search
                </Button>
              </Col>
            </Row>
          </Form>
        </Container>
      </div>

      <Container>
        <h2 className="pt-5">
          {loading
            ? 'loading...'
            : searchedBooks.length
            ? `Viewing ${searchedBooks.length} results:`
            : 'Search for a book to begin'}
        </h2>
        <Row>
          {searchedBooks.map((book) => {
            return (
              <Col md="4">
                <Card key={book.bookId} border="dark">
                  {book.image ? (
                    <Card.Img
                      src={book.image}
                      alt={`The cover for ${book.title}`}
                      variant="top"
                    />
                  ) : null}
                  <Card.Body>
                    <Card.Title>{book.title}</Card.Title>
                    <p className="small">Authors: {book.authors}</p>
                    <Card.Text>{book.description}</Card.Text>
                    {Auth.loggedIn() && (
                      <Button
                        disabled={savedBookIds?.some(
                          (savedBookId) => savedBookId === book.bookId
                        )}
                        className="btn-block btn-info"
                        onClick={() => handleSaveBook(book.bookId)}
                      >
                        {savedBookIds?.some(
                          (savedBookId) => savedBookId === book.bookId
                        )
                          ? 'This book has already been saved!'
                          : 'Save this Book!'}
                      </Button>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            )
          })}
        </Row>
      </Container>
    </>
  )
}

export default SearchBooks
