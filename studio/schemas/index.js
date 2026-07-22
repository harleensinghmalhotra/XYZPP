import {post} from './post.js'
import {localeString, localeText, localePortableText} from './locale.js'

// Locale object types must be registered alongside the document type that uses
// them (field-level i18n — see schemas/locale.js).
export const schemaTypes = [post, localeString, localeText, localePortableText]
