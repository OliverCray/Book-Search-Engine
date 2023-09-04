const { AuthenticationError } = require('apollo-server-express')
const { User } = require('../models')
const { signToken } = require('../utils/auth')
const axios = require('axios')

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (context.user) {
        const userData = await User.findOne({ _id: context.user._id }).select(
          '-__v -password'
        )

        return userData
      }

      throw new AuthenticationError('You are not logged in')
    },
    searchGoogleBooks: async (parent, { query }) => {
      try {
        const response = await axios.get(
          `https://www.googleapis.com/books/v1/volumes?q=${query}`
        )

        if (response.status !== 200) {
          throw new Error('Failed to get book data from Google Books API')
        }

        const bookData = response.data

        const books = bookData.items.map((book) => {
          return {
            bookId: book.id,
            authors: book.volumeInfo.authors || ['No author to display'],
            description: book.volumeInfo.description,
            image: book.volumeInfo.imageLinks?.thumbnail || '',
            link: book.volumeInfo.infoLink,
            title: book.volumeInfo.title,
          }
        })

        return books
      } catch (err) {
        throw new Error(err)
      }
    },
  },

  Mutation: {
    addUser: async (parent, args) => {
      const user = await User.create(args)
      const token = signToken(user)
      return { token, user }
    },
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email })

      if (!user) {
        throw new AuthenticationError('Incorrect email or password')
      }

      const correctPw = await user.isCorrectPassword(password)

      if (!correctPw) {
        throw new AuthenticationError('Incorrect email or password')
      }

      const token = signToken(user)
      return { token, user }
    },
    saveBook: async (parent, { bookData }, context) => {
      const updatedUser = await User.findOneAndUpdate(
        { _id: context.user._id },
        { $addToSet: { savedBooks: bookData } },
        { new: true, runValidators: true }
      )
      return updatedUser
    },
    removeBook: async (parent, { bookId }, context) => {
      const updatedUser = await User.findOneAndUpdate(
        { _id: context.user._id },
        { $pull: { savedBooks: { bookId } } },
        { new: true }
      )
      return updatedUser
    },
  },
}

module.exports = resolvers
