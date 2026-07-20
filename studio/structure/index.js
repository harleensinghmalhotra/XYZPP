import {DocumentsIcon, PublishIcon, EyeClosedIcon} from '@sanity/icons'

// Desk: All Posts + the two visibility views (Published / Hidden), each ordered
// publishedAt desc, cleanly iconed (Sanity icons closest to our language).
export const deskStructure = (S) =>
  S.list()
    .title('Newsroom')
    .items([
      S.listItem()
        .id('all-posts')
        .title('All Posts')
        .icon(DocumentsIcon)
        .child(
          S.documentList()
            .id('all-posts-list')
            .title('All Posts')
            .filter('_type == "post"')
            .defaultOrdering([{field: 'publishedAt', direction: 'desc'}]),
        ),
      S.divider(),
      S.listItem()
        .id('published')
        .title('Published')
        .icon(PublishIcon)
        .child(
          S.documentList()
            .id('published-list')
            .title('Published')
            .filter('_type == "post" && published == true')
            .defaultOrdering([{field: 'publishedAt', direction: 'desc'}]),
        ),
      S.listItem()
        .id('hidden')
        .title('Hidden')
        .icon(EyeClosedIcon)
        .child(
          S.documentList()
            .id('hidden-list')
            .title('Hidden')
            .filter('_type == "post" && published == false')
            .defaultOrdering([{field: 'publishedAt', direction: 'desc'}]),
        ),
    ])
