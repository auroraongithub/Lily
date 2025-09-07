import { cn } from '@/lib/utils'

it('joins classes correctly', () => {
  expect(cn('a', false && 'b', 'c')).toBe('a c')
})
