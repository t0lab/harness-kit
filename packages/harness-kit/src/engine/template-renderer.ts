import Handlebars from 'handlebars'
import { readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const TEMPLATES_DIR = join(dirname(fileURLToPath(import.meta.url)), '../../templates')

Handlebars.registerHelper('includes', (arr: string[], val: string) =>
  Array.isArray(arr) && arr.includes(val)
)

Handlebars.registerHelper('ifEqual', function (
  this: unknown,
  a: string,
  b: string,
  options: Handlebars.HelperOptions
) {
  return a === b ? options.fn(this) : options.inverse(this)
})

export async function renderTemplate(name: string, context: Record<string, unknown>): Promise<string> {
  const templatePath = join(TEMPLATES_DIR, name)
  let source: string
  try {
    source = await readFile(templatePath, 'utf-8')
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`Template not found: ${name}`)
    }
    throw err
  }
  const template = Handlebars.compile(source)
  return template(context)
}
