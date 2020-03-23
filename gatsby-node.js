const path = require(`path`)

const versionMappings = require(`./component-version-mapping.json`)


const fs = require(`fs-extra`)
const yaml = require(`js-yaml`)
const versionMappingsYaml = yaml.load(fs.readFileSync(`./component-version-mapping.yaml`))

const { createFilePath } = require(`gatsby-source-filesystem`)
exports.onCreateNode = ({ node, getNode, actions }) => {
  const { createNodeField } = actions
  if (node.internal.type === `MarkdownRemark`) {

    let originalPath = node.frontmatter.path
    let slug = node.frontmatter.path;

    versionMappingsYaml.forEach(map => {
      if(node.fileAbsolutePath.includes(map.path)) {
          slug = replacePath(originalPath, map.version);

          // Updating {version} in html
          // console.log(node.html)
          // node.html = replacePath(node.html, map.version)
      }
    });

    // Object.entries(versionMappings).forEach(([path, version]) => {
    //   if(node.fileAbsolutePath.includes(path)) {
    //       slug = replacePath(originalPath, version);
    //       console.log("slug: ", slug);
    //   }
    // })
    createNodeField({
      node,
      name: `versionedPath`,
      value: slug,
    })
  }
}

exports.createPages = ({ actions, graphql }) => {
  const { createPage } = actions

  const blogPostTemplate = path.resolve(`src/templates/blogTemplate.js`)

  return graphql(`
    {
      allMarkdownRemark(
        sort: { order: DESC, fields: [frontmatter___date] }
        limit: 1000
      ) {
        edges {
          node {
            html
            frontmatter {
              path
            }
            fields {
              versionedPath
            }
          }
        }
      }
    }
  `).then(result => {
    if (result.errors) {
      return Promise.reject(result.errors)
    }

    return result.data.allMarkdownRemark.edges.forEach(({ node }) => {


      node.html = replacePathHtml(node.html, `2.1`)
      console.log(node.html)

      createPage({
        path: node.fields.versionedPath,
        html: node.html,
        component: blogPostTemplate,
        context: {
          versionedPath: node.fields.versionedPath
        }, // additional data can be passed via context

      })

      // node.frontmatter.tags.forEach((item, i) => {
      //   node.frontmatter.path = replacePath(node.frontmatter.path)
      //
      // });

    })
  })
}

// Replacing '/' would result in empty string which is invalid
const replacePath = (path, version) => (path.replace(`{version}`, version))
const replacePathHtml = (path, version) => (path.replace(`%7Bversion%7D`, version))
// Implement the Gatsby API “onCreatePage”. This is
// called after every page is created.
exports.onCreatePage = ({ page, actions }) => {
  const { createPage, deletePage } = actions

  const oldPage = Object.assign({}, page)
  // Remove trailing slash unless page is /
  page.path = replacePath(page.path)

  console.log(page.path);
  if (page.path !== oldPage.path) {
    // Replace new page with old page
    deletePage(oldPage)
    createPage(page)
  }
}
