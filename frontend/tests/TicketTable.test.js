import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import TicketTable from '../src/components/TicketTable.vue'

// --- mock vue-router ---
const push = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push
  })
}))

const makeTicket = (overrides = {}) => ({
  id: 1,
  key: 'TCK-1',
  createdAt: '2025-01-01T12:00:00Z',
  title: 'Sample ticket',
  description: 'A sample description',
  reporter: { displayName: 'Reporter One' },
  assignee: { displayName: 'Assignee One', email: 'user@example.com' },
  priority: 'High',
  ...overrides
})

const mountTable = (props = {}) =>
  mount(TicketTable, {
    props: {
      tickets: [
        makeTicket({ id: 2, key: 'TCK-2', title: 'Second ticket' }),
        makeTicket({ id: 1, key: 'TCK-1', title: 'First ticket' })
      ],
      search: '',
      assignedOnly: false,
      currentUser: { email: 'user@example.com' },
      ...props
    }
  })

describe('TicketTable.vue', () => {
  beforeEach(() => {
    push.mockClear()
  })

  it('renders headers and ticket rows', () => {
    const wrapper = mountTable()

    const headers = wrapper.findAll('th')
    expect(headers.length).toBeGreaterThan(0)
    expect(wrapper.text()).toContain('Number')
    expect(wrapper.text()).toContain('Title')

    const rows = wrapper.findAll('tbody tr')
    expect(rows.length).toBe(2)
    expect(wrapper.text()).toContain('TCK-1')
    expect(wrapper.text()).toContain('TCK-2')
  })

  it('sorts by id when Number header is clicked and shows sort arrow', async () => {
    const wrapper = mountTable()

    const rowsBefore = wrapper.findAll('tbody tr')
    // initial order is as provided (id 2 then id 1)
    expect(rowsBefore[0].find('td').text()).toBe('TCK-2')
    expect(rowsBefore[1].find('td').text()).toBe('TCK-1')

    const numberHeader = wrapper.findAll('th')[0] // key 'id'
    await numberHeader.trigger('click') // first click => asc

    const rowsAsc = wrapper.findAll('tbody tr')
    expect(rowsAsc[0].find('td').text()).toBe('TCK-1')
    expect(rowsAsc[1].find('td').text()).toBe('TCK-2')

    // arrow should show ▲ for asc
    expect(numberHeader.text()).toContain('▲')

    await numberHeader.trigger('click') // second click => desc

    const rowsDesc = wrapper.findAll('tbody tr')
    expect(rowsDesc[0].find('td').text()).toBe('TCK-2')
    expect(rowsDesc[1].find('td').text()).toBe('TCK-1')

    // arrow should show ▼ for desc
    expect(numberHeader.text()).toContain('▼')
  })

  it('filters by assignedOnly to current user', () => {
    const tickets = [
      makeTicket({
        id: 1,
        key: 'TCK-1',
        assignee: { displayName: 'Me', email: 'me@example.com' }
      }),
      makeTicket({
        id: 2,
        key: 'TCK-2',
        assignee: { displayName: 'Other', email: 'other@example.com' }
      })
    ]

    const wrapper = mount(TicketTable, {
      props: {
        tickets,
        search: '',
        assignedOnly: true,
        currentUser: { email: 'me@example.com' }
      }
    })

    const rows = wrapper.findAll('tbody tr')
    expect(rows.length).toBe(1)
    expect(rows[0].text()).toContain('TCK-1')
    expect(rows[0].text()).not.toContain('TCK-2')
  })

  it('paginates tickets and navigates with Next/Previous', async () => {
    // create 15 tickets so we get 2 pages (limit is 10)
    const manyTickets = Array.from({ length: 15 }, (_, i) =>
      makeTicket({
        id: i + 1,
        key: `TCK-${i + 1}`,
        title: `Ticket ${i + 1}`
      })
    )

    const wrapper = mount(TicketTable, {
      props: {
        tickets: manyTickets,
        search: '',
        assignedOnly: false,
        currentUser: { email: 'user@example.com' }
      }
    })

    // page 1: 10 rows
    let rows = wrapper.findAll('tbody tr')
    expect(rows.length).toBe(10)
    expect(wrapper.find('.prev-btn').attributes('disabled')).toBeDefined()
    expect(wrapper.find('.next-btn').attributes('disabled')).toBeUndefined()

    // go to next page
    await wrapper.find('.next-btn').trigger('click')

    rows = wrapper.findAll('tbody tr')
    expect(rows.length).toBe(5)
    expect(wrapper.find('.next-btn').attributes('disabled')).toBeDefined()
    expect(wrapper.find('.prev-btn').attributes('disabled')).toBeUndefined()

    // go back to previous page
    await wrapper.find('.prev-btn').trigger('click')
    rows = wrapper.findAll('tbody tr')
    expect(rows.length).toBe(10)
  })

  it('navigates to ticket detail when a row is clicked', async () => {
    const wrapper = mountTable()

    const firstRow = wrapper.find('tbody tr')
    await firstRow.trigger('click')

    expect(push).toHaveBeenCalledTimes(1)
    expect(push).toHaveBeenCalledWith({
      name: 'TicketDetail',
      params: { id: 2 } // first ticket in props has id 2
    })
  })
})
