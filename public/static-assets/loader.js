class EthXyzLoader {
  constructor(domain, isLogging) {
    this.data = {
      isLogging: false,
      isFullyLoaded: false,
      domain: '',
      textRecords: {},
      nfts: [],
    }

    this.templates = {
      profile: _.template(document.getElementById('template-profile').innerHTML),
      avatar: _.template(document.getElementById('template-avatar').innerHTML),
      portfolioEntry: _.template(document.getElementById('template-portfolio-entry').innerHTML),
      nftModal: _.template(document.getElementById('template-nft-modal').innerHTML),
      walletEntry: _.template(document.getElementById('template-wallet-entry').innerHTML),
    }

    this.els = {
      containers: {
        main: document.querySelector('main'),
        loading: document.getElementById('loading-container'),
        profile: document.getElementById('profile-container'),
        profileEntry: document.getElementById('profile-entry-container'),
        avatar: document.getElementById('avatar-container'),
        portfolioEntry: document.getElementById('portfolio-entry-container'),
        portfolio: document.getElementById('portfolio-container'),
        nftModal: document.getElementById('nft-modal-container'),
        wallets: document.getElementById('wallets-container'),
        walletsEntry: document.getElementById('wallets-entry-container'),
      },
      toggles: {
        profile: document.getElementById('toggle-profile'),
        portfolio: document.getElementById('toggle-portfolio'),
        wallets: document.getElementById('toggle-wallets'),
      },
    }

    // Set Initial Data
    this.data.isLogging = isLogging
    this.data.domain = domain
    this.log(`Domain is ${domain}`)

    // Load additional data
    this.getTextRecords()
      .then((textRecords) => {
        if (typeof textRecords === 'object') {
          this.data.textRecords = textRecords
        }
        this.getAvatar(domain).then((avatarImg) => {
          let avatarContainer = this.els.containers.avatar
          let image = avatarContainer.querySelector('img')
          let isLoaded = avatarImg.complete && avatarImg.naturalHeight !== 0
          if (!isLoaded) {
            avatarContainer.classList.add('profile__avatar--bg')
          } else {
            avatarContainer.classList.remove('profile__avatar--bg')
            image.classList.remove('hide')
            image.classList.add('profile__avatar--image-bg')
          }
        })
        this.getNfts().then((nfts) => {
          if (Array.isArray(nfts)) {
            this.data.nfts = nfts
          }
          this.render()
        })
      })
      .catch((reason) => {
        window.location.href = '/404'
      })
  }

  getTextRecord(record) {
    if (typeof this.data.textRecords[record] !== 'undefined') {
      let textRecord = this.data.textRecords[record]
      let sanitizedTextRecord = this.sanitizeTextRecord(record, textRecord)
      return sanitizedTextRecord
    } else {
      return null
    }
  }

  sanitizeTextRecord(record, textRecord) {
    if (textRecord !== null) {
      if (record === 'com.twitter') {
        textRecord = textRecord.split("twitter.com/").pop()
        textRecord = textRecord.split("@").pop()
      } else if (record === 'com.github') {
        textRecord = textRecord.split("github.com/").pop()
      } else if (record === 'com.linkedin') {
        textRecord = textRecord.split("linkedin.com/").pop()
      } else if (record === 'com.peepeth') {
        textRecord = textRecord.split("peepeth.com/").pop()
      } else if (record === 'org.telegram') {
        textRecord = textRecord.split("t.me/").pop()
      } else if (record === 'io.keybase') {
        textRecord = textRecord.split("keybase.io/").pop()
      } else if (record === 'url') {
        if (textRecord.substring(0, 4) !== 'http') {
          textRecord = 'https://' + textRecord
        }
      }
    }
    return textRecord
  }

  getWalletAddress(walletName) {
    if (typeof this.data.textRecords.wallets !== 'undefined') {
      let wallet = this.data.textRecords.wallets.find((wallet) => wallet.name === 'ethereum')
      if (typeof wallet !== 'undefined' && typeof wallet.value === 'string') {
        return wallet.value
      }
    }
    return null
  }

  async getAvatar(domain) {
    const img = new Image()
    img.src = 'https://metadata.ens.domains/mainnet/avatar/' + domain
    let value = await img
      .decode()
      .then(() => {
        return img
      })
      .catch((err) => {
        this.log('Avatar failed to load.')
        throw 'Avatar failed to load.'
      })
    return value
  }

  async getTextRecords() {
    let response = await fetch(`/text-records/${this.data.domain}`)
    response = await response.json()
    if (response.success) {
      this.log('Received text records')
      return response.data
    } else {
      this.log('No text records found')
      throw 'No text records found.'
    }
  }

  async getNfts() {
    this.log('Getting NFTs')
    let walletAddress = this.getWalletAddress('ethereum')
    // If there is a valid ethereum wallet fetch NFTs
    if (this.getWalletAddress(walletAddress) !== null) {
      let response = await fetch(`/nfts/${walletAddress}`)
      response = await response.json()
      if (response.success) {
        this.log('Received NFTs')
        return response.data
      } else {
        this.log('No NFTs found')
        throw 'No NFTs found'
      }
    } else {
      this.log('No ethereum wallet')
    }
  }

  log(data) {
    if (this.data.isLogging) {
      console.log(data)
    }
  }

  closeNftModal() {
    this.pauseModalVideo()
    this.els.containers.nftModal.classList.remove('visible')
    this.els.containers.nftModal.classList.add('invisible')
  }

  // Renders data from AJAX into template
  render() {
    this.renderProfile()
    // this.renderAvatar();
    this.renderPortfolio()
    this.renderWallets()
    this.setIsFullyLoaded(true)
  }

  renderProfile() {
    // TODO: Loop through some k:v list instead of doing these 1-by-1
    let description = this.getTextRecord('description')
    let email = this.getTextRecord('email')
    let github = this.getTextRecord('com.github')
    let keybase = this.getTextRecord('io.keybase')
    let linkedin = this.getTextRecord('com.linkedin')
    let peepeth = this.getTextRecord('com.peepeth')
    let phone = this.getTextRecord('phone')
    let telegram = this.getTextRecord('org.telegram')
    let twitter = this.getTextRecord('com.twitter')
    let url = this.getTextRecord('url')
    let contentHash = this.getTextRecord('contentHash')
    let contentHashGateway = '';
    if (contentHash && contentHash.indexOf('ipfs://') !== -1)
      contentHashGateway = this.data.domain + '.link'

    if (
      description === null &&
      email === null &&
      github === null &&
      keybase === null &&
      linkedin === null &&
      peepeth === null &&
      phone === null &&
      telegram === null &&
      twitter === null &&
      url === null &&
      contentHash === null
    ) {
      this.els.containers.profile.classList.add('hide')
    } else {
      this.els.containers.profileEntry.innerHTML = this.templates.profile({
        description: (description) ? _.escape(description) : null,
        email: (email) ? _.escape(email) : null,
        github: (github) ? _.escape(github) : null,
        keybase: (keybase) ? _.escape(keybase) : null,
        linkedin: (linkedin) ? _.escape(linkedin) : null,
        peepeth: (peepeth) ? _.escape(peepeth) : null,
        phone: (phone) ? _.escape(phone) : null,
        telegram: (telegram) ? _.escape(telegram) : null,
        twitter: (twitter) ? _.escape(twitter) : null,
        url: (url) ? _.escape(url) : null,
        contentHash: (contentHash) ? _.escape(contentHash) : null,
        contentHashGateway: (contentHashGateway) ? _.escape(contentHashGateway) : null,
      })
      this.els.toggles.profile.click()
    }
  }

  renderAvatar() {
    let avatarUrl = 'https://loremflickr.com/281/281/design?lock=9'
    let textRecordAvatar = this.getTextRecord('avatar')
    if (
      textRecordAvatar !== null &&
      textRecordAvatar !== undefined &&
      textRecordAvatar.indexOf('http') !== -1
    ) {
      avatarUrl = textRecordAvatar
    }
    this.els.containers.avatar.innerHTML = this.templates.avatar({
      avatar_url: (avatarUrl) ? _.escape(avatarUrl) : null,
    })
  }

  checkNftImageType(nft) {
    let image_type = 'image'
    const nftSources = ['artblocks.io','arweave.net','ethblock.art','ether.cards','etherheads.io','ethouses.io','everyicon.xyz','pinata.cloud','ipfs.io','stickynft.com','vxviewer.vercel.app']
    const imageExtensions = ['.jpg','.jpeg','.gif','.png','.svg']
    nftSources.forEach((source, index) => {
      if (nft.animation_original_url && nft.animation_original_url.includes(source) || nft.animation_url && nft.animation_url.includes(source)) {
        image_type = 'nonstandard'
      }
    })

    if ((nft.animation_original_url !== null && (nft.animation_original_url.slice(-4) ===
      '.glb' || nft.animation_original_url.slice(-5) === '.gltf')) || (nft.animation_url !== null && (nft.animation_url.slice(-4) === '.glb' || nft.animation_url.slice(-5) === '.gltf'))) {
      image_type = '3d'
    } else if ((nft.animation_original_url !== null && (nft.animation_original_url.slice(-4) === '.mp3' || nft.animation_original_url.slice(-4) === '.mp4' || nft.animation_original_url.slice(-4) === '.mov')) || (nft.animation_url !== null && (nft.animation_url.slice(-4) === '.mp3' || nft.animation_url.slice(-4) === '.mp4' || nft.animation_url.slice(-4) === '.mov')) || (nft.image_url !== null && (nft.image_url.slice(-4) === '.mp3' || nft.image_url.slice(-4) === '.mp4' || nft.image_url.slice(-4) === '.mov'))) {
      image_type = 'video'
    } else {
      imageExtensions.forEach((source, index) => {
        if (nft.animation_original_url && nft.animation_original_url.includes(source) || nft.animation_url && nft.animation_url.includes(source)) {
          image_type = 'image'
        }
      })
    }

    return image_type
  }

  renderPortfolio() {
    if (!this.data.nfts.length) {
      this.els.containers.portfolio.classList.add('hide')
    } else {
      let newHtml = ''
      this.data.nfts.forEach((nft, index) => {
        let image_type = this.checkNftImageType(nft)
        let image_url
        if (image_type === 'nonstandard') {
          image_url = (nft.image_preview_url) ? nft.image_preview_url : nft.image_url
        } else {
          if (nft.animation_url) {
            image_url = nft.animation_url
          } else if (nft.animation_original_url) {
            image_url = nft.animation_original_url
          } else if (nft.image_url) {
            image_url = nft.image_url
          } else if (nft.image_original_url) {
            image_url = nft.image_original_url
          } else {
            image_url = '/static-assets/img/placeholder.png'
          }
        }

        let nft_name = '[Unidentified]'
        if (nft.name) {
          nft_name = nft.name
        } else {
          if (nft.token_id) {
            nft_name = '#' + nft.token_id
          }
        }

        newHtml += this.templates.portfolioEntry({
          index: index,
          image_url: (image_url) ? _.escape(image_url) : null,
          image_preview_url: (nft.image_preview_url) ? _.escape(nft.image_preview_url) : null,
          image_type: image_type,
          name: (nft_name) ? _.escape(nft_name) : null,
          description: (nft.description) ? _.escape(nft.description) : null,
          url: (nft.permalink) ? _.escape(nft.permalink) : null,
        })
      })
      this.els.containers.portfolioEntry.innerHTML = newHtml
      this.els.toggles.portfolio.click()
    }
  }

  renderNftModal(e) {
    let nft = this.data.nfts[e.dataset.nftIndex]
    let creator_username =
      // eslint-disable-next-line eqeqeq
      nft.creator != null && nft.creator.user != null && nft.creator.user.username != null
        ? nft.creator.user.username
        : null
    let creator_avatar =
      nft.creator != null && nft.creator.profile_img_url != null
        ? nft.creator.profile_img_url
        : null

    let image_type = this.checkNftImageType(nft)
    let image_url
    if (image_type === 'nonstandard') {
      image_url = nft.image_url
    } else {
      if (nft.animation_url) {
        image_url = nft.animation_url
      } else if (nft.animation_original_url) {
        image_url = nft.animation_original_url
      } else if (nft.image_original_url) {
        image_url = nft.image_original_url
      } else if (nft.image_url) {
        image_url = nft.image_url
      } else {
        image_url = '/static-assets/img/placeholder.png'
      }
    }

    let nft_name = '[Unidentified]'
    if (nft.name) {
      nft_name = nft.name
    } else {
      if (nft.token_id) {
        nft_name = '#' + nft.token_id
      }
    }

    let image_preview_url
    if (image_type == 'video') {
      if (nft.image_url) {
        image_preview_url = nft.image_url
      } else if (nft.image_preview_url) {
        image_preview_url = nft.image_preview_url
      }
    }

    this.els.containers.nftModal.innerHTML = this.templates.nftModal({
      image_url: (image_url) ? _.escape(image_url) : null,
      image_preview_url: (image_preview_url) ? _.escape(image_preview_url) : null,
      image_type: image_type,
      name: (nft_name) ? _.escape(nft_name) : null,
      description: (nft.description) ? _.escape(nft.description) : null,
      creator_username: (creator_username) ? _.escape(creator_username) : null,
      creator_avatar: (creator_avatar) ? _.escape(creator_avatar) : null,
      url: (nft.permalink) ? _.escape(nft.permalink) : null,
    })
    this.els.containers.nftModal.classList.remove('invisible', 'invisible-start')
    this.els.containers.nftModal.classList.add('visible')

    let modalImageContainer = this.els.containers.nftModal.querySelector(
      '#nft-modal-image-container'
    )

    ;(async () => {
      if (image_type === 'video') {
        let videoElement = modalImageContainer.querySelector('video')

        async function getPreviewImage(url) {
          const img = new Image()
          img.src = url
          let value = await img
            .decode()
            .then(() => {
              return img
            })
            .catch((err) => {
              this.log('NFT image failed to load.')
              throw 'NFT image failed to load.'
            })
          return value
        }

        // Don't do anything until after the videoElement has loaded
        videoElement.addEventListener( "loadedmetadata", function (e) {

          (async () => {

            // The responsiveVideo() function will run on initial page load,
            // then re-run each time the browser window is resized or mobile orientation changes
            function responsiveVideo() {

              let newAspectRatio

              if (videoOriginalHeight === 0) {
                videoWidth = videoPreviewImage.naturalWidth
                videoHeight = videoPreviewImage.naturalHeight
                newAspectRatio = videoHeight / videoWidth
                videoElement.setAttribute('poster', nft.image_url)
              }

              let videoContainer = modalImageContainer.querySelector('.nft-modal__video-container')

              let videoFrameMaxWidth = 630 // Max width of the video frame given the current CSS of the NFT modal
              let videoFrameSideMargins = 60 // Total of the margins on either side of the video frame (for mobile)

              // Reset this each time the function runs
              let windowWidth = window.innerWidth

              // If the video's natural width is greater than or equal to videoFrameMaxWidth,
              // use the full width of the modal, using padding-bottom to set height based on aspect ratio
              if (videoWidth > videoFrameMaxWidth) {
                videoContainer.style.paddingBottom = aspectRatio * 100 + "%"

              // If the video's natural width is less than videoFrameMaxWidth:
              } else {

                // If the window width is greater than or equal to the videoWidth + side margins,
                // set the height to the natural height of the video & remove padding-bottom
                if (windowWidth >= (videoWidth + videoFrameSideMargins)) {
                  videoContainer.style.height = videoHeight + 'px'
                  videoContainer.style.width = 'auto'
                  videoContainer.style.removeProperty('padding-bottom')

                  // If the window width is less than the natural width of the video + side margins,
                  // remove height and use the full width of the modal,
                  // using padding-bottom to set height based on aspect ratio
                } else {
                  if (videoOriginalHeight === 0) {
                    let dynamicWidth = windowWidth - videoFrameSideMargins
                    let newHeight = Math.ceil(dynamicWidth * newAspectRatio)
                    videoContainer.style.height = newHeight + 'px'
                  } else {
                    videoContainer.style.removeProperty('height')
                  }
                  videoContainer.style.paddingBottom = aspectRatio * 100 + "%"
                }
              }
            }

            let videoWidth = videoElement.videoWidth
            let videoHeight = videoElement.videoHeight
            let videoOriginalHeight = videoHeight
            let aspectRatio = videoHeight / videoWidth

            // If the video height is 0, wait until the video preview image has loaded so that
            // the image values can be used in the responsiveVideo function below
            let videoPreviewImage = (videoOriginalHeight === 0) ? await getPreviewImage(nft.image_url) : null

            // Run this function once on initial page load
            responsiveVideo()

            // Then, as the window resizes, run responsiveVideo() each time
            window.addEventListener('resize', function() {
              responsiveVideo()
            }.bind(event))

            // Or when there's an orientation change in mobile, run responsiveVideo() - for iOS Chrome
            window.addEventListener('orientationchange', function() {
              responsiveVideo()
            }.bind(event))
          })()

        })
      } else {
        const img = new Image()
        img.src = image_url
        await img
          .decode()
          .then(() => {
            modalImageContainer.classList.remove('loading')
          })
          .catch((err) => {
          })
      }
    })()

    function pauseModalVideo() {
      let videoElement = modalImageContainer.querySelector('video')
      if (videoElement) {
        videoElement.pause();
      }
    }

    let modalMain = document.getElementById('nft-modal')
    document.addEventListener('click', function (event) {
      if (
        !modalContainer.classList.contains('invisible') &&
        (event.target === modalMain || event.target === modalContainer)
      ) {
        pauseModalVideo()
        modalContainer.classList.remove('visible')
        modalContainer.classList.add('invisible')
      }
    }.bind(pauseModalVideo))

    let modalContainer = this.els.containers.nftModal
    window.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        pauseModalVideo()
        modalContainer.classList.remove('visible')
        modalContainer.classList.add('invisible')
      }
    }.bind(pauseModalVideo))
  }

  pauseModalVideo() {
    let modalImageContainer = this.els.containers.nftModal.querySelector('#nft-modal-image-container')
    let videoElement = modalImageContainer.querySelector('video')
    if (videoElement) {
      videoElement.pause();
    }
  }

  renderWallets() {
    let wallets = this.getTextRecord('wallets')
    if (!wallets.length) {
      this.els.containers.wallets.classList.add('hide')
    } else {
      let newHtml = ''
      wallets.forEach((wallet) => {
        if (wallet.value !== '' && wallet.value !== null) {
          newHtml += this.templates.walletEntry({
            name: wallet.name,
            address: wallet.value,
          })
        }
      })
      this.els.containers.walletsEntry.innerHTML = newHtml
      this.els.toggles.wallets.click()
    }
  }

  setIsFullyLoaded(isFullyLoaded) {
    if (isFullyLoaded) {
      this.els.containers.loading.classList.add('hide')
      this.els.containers.main.classList.remove('hide')
    }
    this.data.isFullyLoaded = isFullyLoaded
  }
}
