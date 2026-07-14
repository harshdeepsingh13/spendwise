import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * mailer.js decides whether an SMTP transport exists at module-load time based on
 * env.SMTP_HOST, so each scenario re-imports the module with a fresh env/nodemailer
 * mock via vi.resetModules() + vi.doMock().
 */

const sendMailMock = vi.fn()
const createTransportMock = vi.fn(() => ({ sendMail: sendMailMock }))

/**
 * Re-imports mailer with the given env, wiring fresh nodemailer mocks.
 * @param {object} envOverrides - Values merged onto the mocked `env` export.
 * @returns {Promise<{ sendMail: Function }>} The freshly imported mailer module.
 */
async function importMailer(envOverrides = {}) {
  vi.resetModules()
  sendMailMock.mockReset()
  createTransportMock.mockClear()

  vi.doMock('nodemailer', () => ({
    default: { createTransport: createTransportMock },
  }))
  vi.doMock('../config/env.js', () => ({
    env: { SMTP_FROM: 'noreply@spendwise.app', ...envOverrides },
  }))

  return import('./mailer.js')
}

describe('mailer', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.doUnmock('nodemailer')
    vi.doUnmock('../config/env.js')
  })

  describe('when SMTP is not configured', () => {
    it('does not build a transport', async () => {
      await importMailer({ SMTP_HOST: undefined })
      expect(createTransportMock).not.toHaveBeenCalled()
    })

    it('logs the message instead of sending it', async () => {
      const { sendMail } = await importMailer({ SMTP_HOST: undefined })

      await sendMail({ to: 'a@b.com', subject: 'Hi', html: '<b>Hi</b>', text: 'Hi' })

      expect(sendMailMock).not.toHaveBeenCalled()
      expect(console.log).toHaveBeenCalledTimes(1)
      const logged = console.log.mock.calls[0][0]
      expect(logged).toContain('a@b.com')
      expect(logged).toContain('Hi')
    })

    it('falls back to html in the log when text is absent', async () => {
      const { sendMail } = await importMailer({ SMTP_HOST: undefined })

      await sendMail({ to: 'a@b.com', subject: 'Hi', html: '<p>only-html</p>' })

      expect(console.log.mock.calls[0][0]).toContain('only-html')
    })
  })

  describe('when SMTP is configured', () => {
    it('builds the transport with host, default port 587 and secure=false', async () => {
      await importMailer({ SMTP_HOST: 'smtp.test.com' })

      expect(createTransportMock).toHaveBeenCalledWith({
        host: 'smtp.test.com',
        port: 587,
        secure: false,
        auth: undefined,
      })
    })

    it('uses secure=true when port is 465', async () => {
      await importMailer({ SMTP_HOST: 'smtp.test.com', SMTP_PORT: '465' })

      expect(createTransportMock).toHaveBeenCalledWith(
        expect.objectContaining({ port: 465, secure: true }),
      )
    })

    it('passes a numeric custom port through', async () => {
      await importMailer({ SMTP_HOST: 'smtp.test.com', SMTP_PORT: '2525' })

      expect(createTransportMock).toHaveBeenCalledWith(
        expect.objectContaining({ port: 2525, secure: false }),
      )
    })

    it('includes auth when SMTP_USER is set', async () => {
      await importMailer({
        SMTP_HOST: 'smtp.test.com',
        SMTP_USER: 'user',
        SMTP_PASS: 'pass',
      })

      expect(createTransportMock).toHaveBeenCalledWith(
        expect.objectContaining({ auth: { user: 'user', pass: 'pass' } }),
      )
    })

    it('sends the message through the transport with the configured from address', async () => {
      const { sendMail } = await importMailer({ SMTP_HOST: 'smtp.test.com' })

      await sendMail({
        to: 'a@b.com',
        subject: 'Receipt',
        html: '<b>body</b>',
        text: 'body',
      })

      expect(sendMailMock).toHaveBeenCalledWith({
        from: 'noreply@spendwise.app',
        to: 'a@b.com',
        subject: 'Receipt',
        html: '<b>body</b>',
        text: 'body',
      })
      expect(console.log).not.toHaveBeenCalled()
    })
  })
})
