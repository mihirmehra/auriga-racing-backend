const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  isVerifiedPurchase: {
    type: Boolean,
    default: false
  },
  isApproved: {
    type: Boolean,
    default: true
  },
  helpfulVotes: {
    type: Number,
    default: 0
  },
  reportCount: {
    type: Number,
    default: 0
  },
  images: [{
    url: String,
    alt: String
  }],
  adminResponse: {
    message: String,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    respondedAt: Date
  }
}, {
  timestamps: true
});

// Ensure one review per user per product
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

// Update product rating when review is saved
reviewSchema.post('save', async function() {
  const Review = mongoose.model('Review');
  const Product = mongoose.model('Product');
  
  const stats = await Review.aggregate([
    { $match: { product: this.product, isApproved: true } },
    {
      $group: {
        _id: '$product',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(this.product, {
      'rating.average': Math.round(stats[0].averageRating * 10) / 10,
      'rating.count': stats[0].totalReviews
    });
  }
});

// Update product rating when review is deleted
reviewSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    const Review = mongoose.model('Review');
    const Product = mongoose.model('Product');
    
    const stats = await Review.aggregate([
      { $match: { product: doc.product, isApproved: true } },
      {
        $group: {
          _id: '$product',
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    if (stats.length > 0) {
      await Product.findByIdAndUpdate(doc.product, {
        'rating.average': Math.round(stats[0].averageRating * 10) / 10,
        'rating.count': stats[0].totalReviews
      });
    } else {
      await Product.findByIdAndUpdate(doc.product, {
        'rating.average': 0,
        'rating.count': 0
      });
    }
  }
});

module.exports = mongoose.model('Review', reviewSchema);