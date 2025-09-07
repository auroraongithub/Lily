import { render, screen } from '@testing-library/react'
import Page from '@/app/page'

describe('App smoke test', () => {
  it('renders welcome text', () => {
    render(<Page />)
    expect(screen.getByText(/Welcome to Lily/i)).toBeInTheDocument()
  })
})
