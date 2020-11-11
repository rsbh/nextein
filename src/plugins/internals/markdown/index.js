
import fm from 'frontmatter'
import parser from './parser'
import removePosition from 'unist-util-remove-position'

function normalizeDate (value, { path }) {
  let date
  if (!value) return
  try {
    date = new Date(value)
  } catch (e) {
    console.warn(`Invalid date in ${path}`)
  }

  return JSON.stringify(date)
}

function createOptions (source, raw, options) {
  const { data: extra = {}, content: text } = fm(raw)
  const instance = parser(options)
  const content = instance.runSync(instance.parse(text))
  const date = normalizeDate(extra.date, source)

  return {
    meta: {
      ...source,
      extra,
      date
    },
    content,
    raw
  }
}

/**
 * build
 * @param {Object} options
 * @param {Array} options.remark plugins for remark
 * @param {Array} options.rehype plugins for rehype
 * @param {Object} buildOptions
 * @param {Object} action
 * @param {Function} action.create
 */
export async function build (options, { load, ...source }, { create }) {
  if (source.mimeType === 'text/markdown') {
    const raw = await load()
    create(createOptions(source, raw, options))
  }
}

/**
 * cleanup
 * @param {Object} options
 * @param {Boolean} options.raw set to true to keep raw value in post object. Default to false.
 * @param {Boolean} options.position set to true to keep position information in content hast. Default to false.
 * @param {Array} posts
 */
export function cleanup ({ raw = false, position = false }, posts) {
  return posts.map(post => {
    if (post.data.mimeType === 'text/markdown') {
      if (!position) post.content = removePosition(post.content, true /* hard delete */)
      if (!raw) delete post.raw
    }
    return post
  })
}
