// Desk structure — two views over the single `post` type, both ordered by
// publishedAt desc: "Published" and "Hidden" (filtered on the `published`
// boolean). Prompt 3 layers icons + an "All Posts" view + the welcome pane.
export const deskStructure = (S) =>
  S.list()
    .title('Newsroom')
    .items([
      S.listItem()
        .id('published')
        .title('Published')
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
        .child(
          S.documentList()
            .id('hidden-list')
            .title('Hidden')
            .filter('_type == "post" && published == false')
            .defaultOrdering([{field: 'publishedAt', direction: 'desc'}]),
        ),
    ])
